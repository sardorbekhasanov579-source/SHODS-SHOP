import {loadState,databaseHealth,closeStorage} from './storage.mjs';
if(!process.env.DATABASE_URL){
  console.error('DATABASE_URL o‘rnatilmagan. Render va Neon ulanishini tekshiring.');
  process.exitCode=1;
}else{
  try{
    const state=await loadState('unused.json',()=>({users:[],items:[],orders:[],reviews:[],tickets:[],favorites:{},audit:[],sessions:{}}));
    const health=await databaseHealth();
    console.log('SHODS SHOP baza ulandi:',health.storage);
    console.log('Foydalanuvchilar:',state.users.length);
    const admins=state.users.filter(u=>u.role==='admin');
    console.log('Administratorlar:',admins.length);
    // Login name is not a password, but still don't print personal data.
    if(admins.length)console.log('Admin loginlar:',admins.map(u=>u.login).join(', '));
  }catch(e){console.error('Baza ulanish xatosi:',e.message);process.exitCode=1}
  finally{await closeStorage()}
}
