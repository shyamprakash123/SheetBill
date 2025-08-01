import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  // In vite.config.ts
  server: {
    proxy: {
      "/api/image": {
        target: "https://drive.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/image/, ""),
      },
    },
  },
});
