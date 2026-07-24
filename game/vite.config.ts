import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { DEFAULT_CHAIN_BRIDGE_URL } from "./src/app/chainConfig";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const chainBridgeTarget =
    env.VITE_CHAIN_BRIDGE_URL?.trim().replace(/\/+$/, "") ||
    DEFAULT_CHAIN_BRIDGE_URL;
  const proxyToChainBridge = () => ({
    target: chainBridgeTarget,
    changeOrigin: true
  });

  return {
    plugins: [react()],
    publicDir: resolve(process.cwd(), "../assets/rpg_v2"),
    server: {
      proxy: {
        "/api/rpg": proxyToChainBridge(),
        "/connect.html": proxyToChainBridge(),
        "/wallet.html": proxyToChainBridge(),
        "/artifacts": proxyToChainBridge(),
        "/vendor": proxyToChainBridge()
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1600
    }
  };
});
