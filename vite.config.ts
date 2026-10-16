import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 子路径部署（例如 GitHub Pages 的 /time-quota/）时通过 BASE_PATH 覆盖
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
