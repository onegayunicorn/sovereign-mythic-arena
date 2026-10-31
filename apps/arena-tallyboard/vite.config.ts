import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { host: "0.0.0.0", port: 3001, strictPort: true },
  preview: { host: "0.0.0.0", port: 4301, strictPort: true },
});
