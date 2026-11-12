import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const child=(script)=>spawn(process.execPath,[script],{cwd:root,stdio:'inherit',env:process.env});
const api=child('server/index.mjs');
const vite=child('node_modules/vite/bin/vite.js');
let closing=false;
function stop(){if(closing)return;closing=true;api.kill();vite.kill();setTimeout(()=>process.exit(0),350).unref();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
api.on('exit',()=>{if(!closing)stop()});vite.on('exit',()=>{if(!closing)stop()});
