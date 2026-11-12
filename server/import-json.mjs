// Explicit one-time migration. Does not overwrite populated live data.
import fs from 'node:fs';
import path from 'node:path';
import {Pool} from 'pg';
const file=process.argv[2];
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL environment variable is required');
if(!file)throw Error('Usage: npm run db:import -- path/to/old/db.json');
const real=path.resolve(file);
const data=JSON.parse(fs.readFileSync(real,'utf8'));
for(const field of ['users','items','orders','reviews','tickets'])if(!Array.isArray(data[field]))throw Error('Invalid JSON: '+field);
if(data.users.some(x=>String(x.login).startsWith('demo_')))throw Error('Demo accounts with public passwords found; do not migrate these accounts into the live service. Use a cleaned export.');
data.sessions={}; data.favorites??={};data.audit??=[];
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try{
  await pool.query(`CREATE TABLE IF NOT EXISTS shods_app_state (id SMALLINT PRIMARY KEY CHECK (id=1), version BIGINT NOT NULL DEFAULT 0, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const r=await pool.query(`INSERT INTO shods_app_state(id,version,payload) VALUES(1,0,$1::jsonb) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,version=shods_app_state.version+1,updated_at=now() WHERE shods_app_state.version=0 AND jsonb_array_length(shods_app_state.payload->'users')=0 AND jsonb_array_length(shods_app_state.payload->'orders')=0 RETURNING id`,[JSON.stringify(data)]);
  if(r.rowCount!==1)throw Error('Database already has data or changed: refusing to overwrite.');
  console.log(`Migrated ${data.users.length} user(s), ${data.items.length} listing(s), ${data.orders.length} order(s).`);
}finally{await pool.end()}
