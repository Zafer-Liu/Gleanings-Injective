import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const gameDirectory = process.cwd();
const viteEntry = resolve(
  gameDirectory,
  "node_modules/vite/bin/vite.js"
);
const localBypass = "127.0.0.1,localhost";
process.env.NO_PROXY = [process.env.NO_PROXY, localBypass]
  .filter(Boolean)
  .join(",");
process.env.no_proxy = process.env.NO_PROXY;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 }
      }
    }
  ],
  webServer: {
    command: `"${process.execPath}" "${viteEntry}" --host 127.0.0.1 --port 4173 --strictPort`,
    cwd: gameDirectory,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe"
  }
});
