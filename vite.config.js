import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
const packageVersion=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
export default defineConfig({
  plugins:[react()],
  define:{__SHODS_APP_VERSION__:JSON.stringify(packageVersion)},
  server:{host:'0.0.0.0', port:5173, strictPort:false, proxy:{'/api':'http://127.0.0.1:3001'}},
  build:{outDir:'dist'}
});
