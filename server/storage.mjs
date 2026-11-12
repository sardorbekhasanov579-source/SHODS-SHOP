import './env.mjs';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.DATABASE_URL;
const prod = process.env.NODE_ENV === 'production';
if (prod && !url) throw Error('DATABASE_URL is required in production; refusing to use ephemeral disk.');
const pg = url ? (await import('pg')).default : null;
const pool = url ? new pg.Pool({connectionString: url, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000}) : null;
const TABLE = 'shods_app_state';
let version = 0;
let activeClient = null;
let localState = null;
let operationQueue = Promise.resolve();

function prepare(state){
  if (!state?.users || !state?.items || !state?.orders) throw Error('Invalid persisted marketplace state');
  state.reviews ??= []; state.tickets ??= []; state.favorites ??= {};
  state.audit ??= []; state.sessions ??= {}; state.telegramChallenges ??= {};
  return state;
}

export async function loadState(file, createSeed){
  if(!pool){
    fs.mkdirSync(path.dirname(file),{recursive:true});
    if(fs.existsSync(file)){localState=prepare(JSON.parse(fs.readFileSync(file,'utf8')));return localState;}
    const initial=prepare(createSeed());
    fs.writeFileSync(file,JSON.stringify(initial,null,2));
    localState=initial;
    return initial;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (id SMALLINT PRIMARY KEY CHECK (id=1), version BIGINT NOT NULL DEFAULT 0, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`INSERT INTO ${TABLE}(id,version,payload) VALUES (1,0,$1::jsonb) ON CONFLICT (id) DO NOTHING`,[JSON.stringify(prepare(createSeed()))]);
  const result=await pool.query(`SELECT version,payload FROM ${TABLE} WHERE id=1`);
  if(result.rowCount!==1)throw Error('PostgreSQL state row missing');
  version=Number(result.rows[0].version);
  return prepare(result.rows[0].payload);
}

export async function persistState(file,state){
  if(!pool){
    const tmp=file+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(state,null,2));
    fs.renameSync(tmp,file);
    return;
  }
  const snapshot=JSON.stringify(state);
  if(activeClient){
    // The database row has already been locked for this request. Other servers
    // cannot overwrite our changes until the request transaction commits.
    const updated=await activeClient.query(`UPDATE ${TABLE} SET payload=$1::jsonb,version=version+1,updated_at=now() WHERE id=1 RETURNING version`,[snapshot]);
    version=Number(updated.rows[0].version);
    return;
  }
  // Standalone CLI tools (admin:create) use an optimistic comparison.
  const updated=await pool.query(`UPDATE ${TABLE} SET payload=$1::jsonb,version=version+1,updated_at=now() WHERE id=1 AND version=$2 RETURNING version`,[snapshot,version]);
  if(updated.rowCount!==1)throw Error('DATABASE_VERSION_CONFLICT: database changed; retry the command.');
  version=Number(updated.rows[0].version);
}

// One process queue prevents a request from changing the shared in-memory
// snapshot while another request is using it. PostgreSQL row locks serialize
// writes across server instances and CLI updates without lost updates.
export function withFreshState(file, write, fn){
  const task=operationQueue.catch(()=>{}).then(async()=>{
    if(!pool){
      // Local CLI updates become visible to a running development server.
      return fn(localState);
    }
    const client=await pool.connect();
    try{
      if(write)await client.query('BEGIN');
      const result=await client.query(`SELECT version,payload FROM ${TABLE} WHERE id=1 ${write?'FOR UPDATE':''}`);
      if(result.rowCount!==1)throw Error('PostgreSQL state row missing');
      version=Number(result.rows[0].version);
      const state=prepare(result.rows[0].payload);
      if(write)activeClient=client;
      const value=await fn(state);
      if(write)await client.query('COMMIT');
      return value;
    }catch(e){
      if(write)await client.query('ROLLBACK').catch(()=>{});
      throw e;
    }finally{activeClient=null;client.release()}
  });
  operationQueue=task.catch(()=>{});
  return task;
}

export async function databaseHealth(){
  if(!pool)return {storage:'json',connected:true};
  await pool.query('SELECT 1');
  return {storage:'postgres',connected:true};
}
export async function closeStorage(){await operationQueue.catch(()=>{});await pool?.end();}
