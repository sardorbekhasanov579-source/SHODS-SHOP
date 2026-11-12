import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadState,withFreshState,persistState,closeStorage} from './storage.mjs';
const file=process.env.SHODS_DATA_PATH||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'data','db.json');
const empty=()=>({users:[],items:[],orders:[],reviews:[],tickets:[],favorites:{},audit:[],sessions:{}});
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
function passwordHash(password){const salt=crypto.randomBytes(16).toString('hex');return `${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`}
try{
  const login=(await rl.question('Mavjud admin login: ')).trim().toLowerCase();
  const password=await rl.question('YANGI kuchli parol (16+ belgi; chatga yubormang): ');
  if(password.length<16||password.length>128)throw Error('Yangi parol kamida 16 belgi bo‘lishi kerak');
  await loadState(file,empty);
  await withFreshState(file,true,async db=>{
    const u=db.users.find(u=>u.login===login&&u.role==='admin');
    if(!u)throw Error('Bu bazada admin topilmadi. DATABASE_URL ni tekshiring.');
    u.passwordHash=passwordHash(password);
    // Log every existing session out; this revokes old admin sessions.
    db.sessions={};
    await persistState(file,db);
  });
  console.log('Admin paroli yangilandi. Endi yangi parol bilan qayta kiring.');
}catch(e){console.error('Admin parolini yangilash xatosi:',e.message);process.exitCode=1}
finally{rl.close();await closeStorage()}
