import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasmPack from 'vite-plugin-wasm-pack'
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
      react(),
      tailwindcss(),
      wasmPack(['./main_crate']),
      wasm(),
      topLevelAwait(),
  ],
  resolve: {
      alias: {
          "@": path.resolve(__dirname, "./src"),
      },
  },
})
