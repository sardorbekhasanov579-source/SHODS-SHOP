import './env.mjs';
// SHODS SHOP persistent state adapter.
// Local development uses a JSON file; production uses Neon-compatible PostgreSQL.
// PostgreSQL mode is a single-process pilot persistence layer, NOT a horizontally
// scalable relational marketplace design. Writes use optimistic version checks.
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.DATABASE_URL;
const prod = process.env.NODE_ENV === 'production';
if (prod && !url) throw Error('DATABASE_URL is required in production; refusing to use ephemeral disk.');
const pg = url ? (await import('pg')).default : null;
const pool = url ? new pg.Pool({connectionString:url, max:5, connectionTimeoutMillis:10000, idleTimeoutMillis:30000}) : null;
let version = 0;
let writeQueue=Promise.resolve();
const TABLE = 'shods_app_state';

export async function loadState(file, createSeed){
  if(!pool){
    fs.mkdirSync(path.dirname(file),{recursive:true});
    try{
      const data = JSON.parse(fs.readFileSync(file,'utf8'));
      if(!data.users || !data.items || !data.orders) throw Error('Invalid local database');
      data.reviews??=[];data.tickets??=[];data.favorites??={};data.audit??=[];data.sessions??={};data.telegramChallenges??={};
      return data;
    }catch(e){
      if(fs.existsSync(file)) throw Error(`Existing JSON database cannot be read: ${e.message}. Refusing overwrite.`);
      const seeded=createSeed();
      seeded.sessions??={};seeded.telegramChallenges??={};
      fs.writeFileSync(file,JSON.stringify(seeded,null,2));
      return seeded;
    }
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (id SMALLINT PRIMARY KEY CHECK (id=1), version BIGINT NOT NULL DEFAULT 0, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const starter=createSeed();starter.sessions??={};starter.telegramChallenges??={};
  await pool.query(`INSERT INTO ${TABLE}(id,version,payload) VALUES (1,0,$1::jsonb) ON CONFLICT (id) DO NOTHING`,[JSON.stringify(starter)]);
  const result=await pool.query(`SELECT version,payload FROM ${TABLE} WHERE id=1`);
  if(result.rowCount!==1)throw Error('PostgreSQL state row missing');
  version=Number(result.rows[0].version);
  const state=result.rows[0].payload;
  if(!state?.users || !state?.orders || !state?.items) throw Error('Invalid PostgreSQL state');
  state.reviews??=[];state.tickets??=[];state.favorites??={};state.audit??=[];state.sessions??={};state.telegramChallenges??={};
  return state;
}

export async function persistState(file, state){
  if(!pool){
    const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,file);
    return;
  }
  // Copy the current state immediately, then serialize writes in this process.
  const snapshot=JSON.stringify(state);
  const op=writeQueue.catch(()=>{}).then(async()=>{
    const updated=await pool.query(`UPDATE ${TABLE} SET payload=$1::jsonb,version=version+1,updated_at=now() WHERE id=1 AND version=$2 RETURNING version`,[snapshot,version]);
    if(updated.rowCount!==1){
      const err=Error('DATABASE_VERSION_CONFLICT: another server changed the database. Restart and retry.');
      err.status=409;throw err;
    }
    version=Number(updated.rows[0].version);
  });
  writeQueue=op;
  return op;
}

export async function databaseHealth(){
  if(!pool)return {storage:'json',connected:true};
  await pool.query('SELECT 1');
  return {storage:'postgres',connected:true};
}

export async function closeStorage(){await writeQueue.catch(()=>{});await pool?.end()}
