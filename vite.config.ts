import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import handler from "./api/server";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "api-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url.startsWith("/_api") || req.url.startsWith("/api"))) {
            await handler(req, res);
          } else {
            next();
          }
        });
      },
    },
  ],
});

