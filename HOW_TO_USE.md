# ChetiCheck: Non-Technical User & Testing Manual

Welcome to ChetiCheck! This guide is written for non-technical team members, hackathon judges, peer testers, and evaluators. You do **not** need any coding knowledge or development tools to test, explore, and contribute to this project.

---

## 1. What is ChetiCheck? (In Plain English)

ChetiCheck is an online system that prevents fake university degrees and altered academic certificates in Kenya.

When a university issues a degree, ChetiCheck creates a unique digital signature and embeds it into a QR code. When an employer or scholarship officer scans that QR code, the system immediately checks whether the certificate is genuine and whether anyone has altered the student's name, degree, or graduation year.

The entire check happens in seconds, without requiring the employer to contact the university registrar or wait weeks for official verification letters.

---

## 2. Quick 5-Minute Testing Walkthrough

Follow these steps on your phone, tablet, or laptop browser to test the full system:

### Step 1: Open the Application
- **Live Web App**: [https://cheticheck.vercel.app](https://cheticheck.vercel.app)
- You will see the public homepage showcasing sample verifiable certificates.

### Step 2: View a Sample Certificate
- Click on any sample certificate (for example, *David Mark Njogu — Bachelor of Science in Computing*).
- Notice the certificate presentation: it includes the graduate's name, degree title, university name, completion date, and an embedded high-resolution QR code badge.

### Step 3: Verify the Certificate
- Click the **"Verify Credential"** button or scan the QR code with your mobile camera.
- You will be taken to the verification screen.
- Notice the large green badge that appears: **"VERIFIED AUTHENTIC"**.
- This proves that the certificate matches the university's cryptographic records exactly.

### Step 4: Test the Tamper Detection Engine
- On the verification screen, locate the **"Tamper Demo"** section.
- Click the button labeled **"Simulate Tampered Record"** (this simulates a fraudster altering the certificate, such as changing "Second Class" to "First Class Honours").
- Notice what happens immediately:
  - The badge flips from green to a prominent red warning: **"TAMPERED / ALTERED"**.
  - The system explains that the cryptographic signature does not match the certificate data.
  - This demonstrates that even changing a single punctuation mark is detected instantly.

### Step 5: Test the Issuer Dashboard (University Admin)
- In the top navigation bar, click on **"Issuer Portal"**.
- Here you can see the university registrar's view:
  - List of issued certificates.
  - The button to **"Issue New Credential"** (try creating a certificate with your own name!).
  - The option to **"Revoke"** a credential (for example, if a degree was awarded in error).
  - If you revoke a certificate and then try to verify it, the system will clearly show **"REVOKED"**.

---

## 3. Expected Outcomes vs What to Watch Out For

| Screen | Expected Outcome | Issue / Bug (Report This!) |
| :--- | :--- | :--- |
| **Home Page** | Clean list of sample certificates, fast loading. | Blank page, overlapping text, or buttons that do not click. |
| **Certificate View** | High-contrast certificate with readable name and QR badge. | QR code image fails to appear or is blurry. |
| **Verification Page** | Green "AUTHENTIC" badge on original certificates. | Infinite loading spinner, or showing "Altered" on an untampered sample. |
| **Tamper Demo** | Immediate Red "TAMPERED" stamp upon modification. | System still saying "Authentic" after tampering. |
| **Issuer Dashboard** | Form allows typing student name, degree, and submitting. | Form submission fails with an unexplained error popup. |

---

## 4. How You Can Contribute (Without Writing Code)

You do not need to be a software developer to make ChetiCheck better. Here is how non-technical contributors can make an enormous impact:

### A. Device & Browser Usability Testing
- Open the site on different devices: iPhone (Safari), Android (Chrome), Windows, Mac, or tablet.
- Does anything look cramped? Does any text overflow off the screen?
- Are the buttons easy to tap with your thumb on a mobile screen?

### B. User Experience & Copywriting
- Are the explanations clear and simple to understand?
- Are there technical terms (like "ECDSA" or "canonical hash") that should be rewritten in simpler words for employers?
- Suggest better descriptions or clearer instructions.

### C. Gathering Real-World Feedback
- Ask classmates, friends, or teachers: *"If you were an employer hiring someone, would this certificate make you trust their credentials?"*
- Note down their reactions and share them with the team.

---

## 5. How to Report a Bug or Share Feedback

If you find something broken or confusing, copy this short template, fill it out, and send it to the team WhatsApp group or GitHub Issues:

```markdown
### What I was doing:
(e.g., I tried to issue a new certificate with my name on mobile Safari)

### What happened:
(e.g., The screen stayed loading for 15 seconds and did not show the certificate)

### What I expected:
(e.g., The certificate should show up with a QR code)

### Device & Browser:
(e.g., Samsung Galaxy A14, Google Chrome)

### Screenshot (if available):
[Attach screenshot or photo of screen]
```
