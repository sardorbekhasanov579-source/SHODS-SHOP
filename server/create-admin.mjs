// Create a trusted administrator locally or in the configured PostgreSQL project.
// Never exposes a public administrator registration endpoint.
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadState,persistState,closeStorage} from './storage.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const file=process.env.SHODS_DATA_PATH||path.resolve(root,'data','db.json');
const seed=()=>({users:[],items:[],orders:[],reviews:[],tickets:[],favorites:{},audit:[],sessions:{}});
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
let result='';
try{
  const login=(await rl.question('Admin login (4+ belgi, lotin harf/raqam): ')).trim().toLowerCase();
  const name=(await rl.question('Admin ism-familiyasi: ')).trim();
  const password=await rl.question('Admin parol (kamida 12 belgi, boshqalarga ko‘rsatmang): ');
  if(!/^[a-z0-9_]{4,45}$/.test(login)||!name||password.length<12||password.length>128){throw Error('Login, ism yoki parol yaroqsiz')}
  const db=await loadState(file,seed);
  if(db.users.some(u=>u.login===login))throw Error('Bu login band');
  if(db.users.some(u=>u.role==='admin'))throw Error('Admin mavjud. Yangi admin uchun avval ruxsat/vakolat jarayonini joriy qiling.');
  const salt=crypto.randomBytes(16).toString('hex');
  const passwordHash=`${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`;
  db.users.push({id:'ADM_'+crypto.randomBytes(9).toString('hex'),name,login,passwordHash,role:'admin',status:'active',institute:'SHODS SHOP',faculty:'Administratsiya',direction:'Boshqaruv',course:1});
  await persistState(file,db);
  result='Admin yaratilgan va saqlangan. Barcha faol serverlarni yangilang/restart qiling.';
} catch(e){console.error('Admin yaratish xatosi:',e.message);process.exitCode=1} finally{rl.close();await closeStorage()}
if(result) console.log(result);
