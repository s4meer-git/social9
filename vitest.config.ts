import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Same aliases as tsconfig.json: the app's own code and the open-source engine in /core.
export default defineConfig({
  resolve: {
    alias: {
      "@social9/core": fileURLToPath(new URL("./core/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
