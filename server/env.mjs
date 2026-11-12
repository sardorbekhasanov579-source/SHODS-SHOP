// Load optional local .env without adding packages. Existing process env always wins.
// Keep this import before any module that reads process.env during initialization.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath=path.join(directory,'.env');
if(fs.existsSync(envPath) && typeof process.loadEnvFile==='function'){
  process.loadEnvFile(envPath);
}
