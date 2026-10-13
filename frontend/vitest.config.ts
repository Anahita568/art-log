import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: mixing vitest's own (older) nested `vite` dependency with
// the top-level `vite` + @vitejs/plugin-react's types causes a plugin-type conflict. Tests don't
// need the React plugin's dev-only features, so this config stays minimal and standalone.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
});
