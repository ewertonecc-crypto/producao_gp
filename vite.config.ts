import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ["projeto.noxa.com.br"],
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["projeto.noxa.com.br"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
