import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

/**
 * Build a permissive list of hosts for Vite’s dev-server.
 *  – “all” disables host checking altogether (Vite ≥5).
 *  – On Replit we also add the current workspace hostname, if we can infer it.
 */
function getAllowedHosts() {
  if (process.env.NODE_ENV === "production") {
    return []; // no extra hosts needed once the site is built
  }

  // Replit exposes the pod’s hostname in HOSTNAME, e.g. “c84d4766-…”.
  const podHost = process.env.HOSTNAME
    ? `${process.env.HOSTNAME}.picard.replit.dev`
    : null;

  return ["all", podHost].filter(Boolean);
}

export default defineConfig(async () => {
  // Core plugin stack
  const plugins = [react(), runtimeErrorOverlay()];

  // Pull in Replit’s live-preview overlay only in dev
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    plugins,

    /* ---------- Paths & aliases ---------- */
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),

    /* ---------- Build output ---------- */
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },

    /* ---------- Dev-server tweaks for Replit ---------- */
    server: {
      host: true, // listen on 0.0.0.0 so Replit can proxy it
      allowedHosts: getAllowedHosts(),

      // Seamless HMR through Replit’s HTTPS proxy
      hmr: {
        host: process.env.HOSTNAME,
        protocol: "wss",
        clientPort: 443,
      },
    },
  };
});
