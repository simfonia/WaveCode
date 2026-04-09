import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  server: {
    watch: {
      // 雙重保險：忽略所有包含 src-tauri/resources 的路徑變動
      ignored: [
        '**/src-tauri/resources/**',
        path.resolve(__dirname, '../src-tauri/resources/**')
      ]
    }
  }
});
