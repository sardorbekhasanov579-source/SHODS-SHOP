import {loadState,databaseHealth,closeStorage} from './storage.mjs';
if(!process.env.DATABASE_URL){console.error('DATABASE_URL o‘rnatilmagan.');process.exitCode=1}
else {try{await loadState('unused.json',()=>({users:[],items:[],orders:[],reviews:[],tickets:[],favorites:{},audit:[],sessions:{}}));const state=await databaseHealth();console.log('SHODS SHOP baza ulandi:',state.storage)}catch(e){console.error('Baza ulanish xatosi:',e.message);process.exitCode=1}finally{await closeStorage()}}
