import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/user pc/.gemini/antigravity/brain/7cb770b5-7880-4124-a749-581b3b1a9ecb';

function cdpRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://127.0.0.1:9222');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Creating new CDP page via PUT...');
  const newTarget = await cdpRequest('/json/new?http://localhost:5173/wallet', 'PUT');
  const wsUrl = newTarget.webSocketDebuggerUrl;
  console.log('Target created:', newTarget.id, wsUrl);

  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.addEventListener('open', async () => {
    console.log('Connected to target via WebSocket.');

    const send = (method, params = {}) => {
      return new Promise((res, rej) => {
        const msgId = id++;
        pending.set(msgId, { res, rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded' || msg.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push(msg);
      }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    });

    try {
      await send('Page.enable');
      await send('Runtime.enable');

      // Wait 3.5s for React render and TanStack query fetch
      await new Promise(r => setTimeout(r, 3500));

      // Desktop viewport: 1440x900
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await new Promise(r => setTimeout(r, 800));

      const desktopEval = await send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          title: document.title,
          h1: document.querySelector('h1')?.innerText,
          copyCount: document.querySelectorAll('[class*="copyCard"]').length,
          hasAlerts: document.querySelectorAll('[class*="alertBanner"]').length
        })`,
        returnByValue: true
      });
      console.log('Desktop page metrics:', desktopEval.result.value);

      const desktopScreenshot = await send('Page.captureScreenshot', { format: 'png' });
      const desktopPath = path.join(ARTIFACTS_DIR, 'wallet-desktop-1440.png');
      fs.writeFileSync(desktopPath, Buffer.from(desktopScreenshot.data, 'base64'));
      console.log('Saved desktop screenshot to:', desktopPath);

      // Mobile viewport: 390x844
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 800));

      const mobileEval = await send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        })`,
        returnByValue: true
      });
      console.log('Mobile page metrics:', mobileEval.result.value);

      const mobileScreenshot = await send('Page.captureScreenshot', { format: 'png' });
      const mobilePath = path.join(ARTIFACTS_DIR, 'wallet-mobile-390.png');
      fs.writeFileSync(mobilePath, Buffer.from(mobileScreenshot.data, 'base64'));
      console.log('Saved mobile screenshot to:', mobilePath);

      // Navigate to /issuer
      await send('Page.navigate', { url: 'http://localhost:5173/issuer' });
      await new Promise(r => setTimeout(r, 2000));

      // Click on Investigations tab
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const invBtn = btns.find(b => b.textContent.includes('Investigations'));
          if (invBtn) invBtn.click();
          return !!invBtn;
        })()`,
        returnByValue: true
      });
      await new Promise(r => setTimeout(r, 1000));

      // Capture Issuer Investigations screenshot
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await new Promise(r => setTimeout(r, 500));

      const issuerScreenshot = await send('Page.captureScreenshot', { format: 'png' });
      const issuerPath = path.join(ARTIFACTS_DIR, 'issuer-investigations-desktop.png');
      fs.writeFileSync(issuerPath, Buffer.from(issuerScreenshot.data, 'base64'));
      console.log('Saved issuer investigations screenshot to:', issuerPath);

      // Close target
      await cdpRequest(`/json/close/${newTarget.id}`, 'PUT');
      ws.close();
      console.log('Visual QA complete!');
    } catch (e) {
      console.error('Error during QA:', e);
      try { await cdpRequest(`/json/close/${newTarget.id}`, 'PUT'); } catch {}
      ws.close();
    }
  });
}

run().catch(console.error);
