// Local integration harness: real isolated PostgreSQL + UI, simulated Google identities.
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
 create table auth.identities(user_id uuid,provider text,identity_data jsonb);
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
await db.exec(fs.readFileSync(new URL('../supabase/migrations/20260905192908_community_decks.sql',import.meta.url),'utf8'));
const actors={owner:'11111111-1111-4111-8111-111111111111',other:'22222222-2222-4222-8222-222222222222',admin:'33333333-3333-4333-8333-333333333333'};
for(const [name,id] of Object.entries(actors)) {
 const email=name==='admin'?'jdmarinv@gmail.com':`${name}@example.com`;
 await db.query('insert into auth.users values($1,$2,now(),$3)',[id,email,JSON.stringify({full_name:`Prueba ${name}`})]);
 await db.query("insert into auth.identities values($1,'google',$2)",[id,JSON.stringify({email,email_verified:true})]);
}
let queue=Promise.resolve();
const server=await createServer({configFile:false,optimizeDeps:{entries:['tests/fixtures/community-ui.jsx']},plugins:[react(),{
 name:'isolated-community-test',enforce:'pre',resolveId(source){if(source.endsWith('/community/client')||source==='./client')return path.resolve('tests/fixtures/community-client.js');},
 configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(req.url==='/__test') {res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__test','<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Prueba Community Decks</title></head><body><div id="root"></div><script type="module" src="/tests/fixtures/community-ui.jsx"></script></body></html>'));return;}
  if(req.url!=='/__test/rpc')return next();
  let body='';for await(const chunk of req)body+=chunk;
  queue=queue.then(async()=>{try{
    const {actor,action,payload}=JSON.parse(body);if(!actors[actor])throw new Error('Actor inválido');
    await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[actors[actor]]);await db.exec('set role authenticated');
    const result=await db.query('select public.study_community($1,$2) as data',[action,JSON.stringify(payload)]);
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result.rows[0].data));
  }catch(error){res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:error.message}));}});
 });}
}],server:{host:'127.0.0.1',port:5174,strictPort:true}});
await server.listen();server.printUrls();
