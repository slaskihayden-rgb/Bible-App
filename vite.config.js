import { defineConfig } from "vite";

export default defineConfig({
  base: "/Bible-App/",
  build: {
    target: "es2020",
    sourcemap: false,
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@xenova/transformers"],
  },
});
