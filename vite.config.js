import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
      "react-router-dom": path.resolve("./node_modules/react-router-dom"),
    },
  },
  define: {
    global: "window",
  },
  server: {
    // Allow your local dev server to accept requests from the loca.lt tunnel
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "wise-states-march.loca.lt" // add your current loca.lt URL here
    ],
  },
});
