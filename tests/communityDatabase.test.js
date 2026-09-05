import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const ids={ owner:'11111111-1111-4111-8111-111111111111', other:'22222222-2222-4222-8222-222222222222', admin:'33333333-3333-4333-8333-333333333333', impostor:'44444444-4444-4444-8444-444444444444' };
const question={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',question:'¿Respuesta?',options:[{letter:'A',text:'Uno'},{letter:'B',text:'Dos'}],answer_official:'A',explanation:'Explicación'};
test('database enforces Google identities, private drafts, moderation, ownership and unique consensus votes',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
 create table auth.identities(user_id uuid,provider text,identity_data jsonb);
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
 await db.exec(fs.readFileSync(new URL('../supabase/migrations/20260905192908_community_decks.sql',import.meta.url),'utf8'));
 for(const [name,id] of Object.entries(ids)) {
 const email=name==='admin'?'jdmarinv@gmail.com':`${name}@example.com`;
 await db.query('insert into auth.users values ($1,$2,now(),$3)',[id,email,JSON.stringify({full_name:name,email:'jdmarinv@gmail.com',is_admin:true})]);
 await db.query('insert into auth.identities values ($1,$2,$3)',[id,name==='impostor'?'email':'google',JSON.stringify({email,email_verified:true})]);
 }
 const as=async(name)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[name]||'']);await db.exec(`set role ${name?'authenticated':'anon'}`);};
 const call=async(action,payload={})=>(await db.query('select public.study_community($1,$2) as data',[action,JSON.stringify(payload)])).rows[0].data;
 await as(null);await assert.rejects(call('list'));
 await as('impostor');await assert.rejects(call('profile'),/Google verificada/);
 await as('owner');assert.equal((await call('profile')).is_admin,false);
 await assert.rejects(db.exec('update public.study_members set is_admin=true'),/permission denied/);
 const guide=await call('save',{title:'Prueba',questions:[question]});
 assert.equal(guide.status,'draft');
 await assert.rejects(call('save',{title:'Bad',questions:[{...question,answer_official:'C'}]}),/respuesta válida/);
 await call('activity',{kind:'study'});
 await as('other');await call('profile');
 await assert.rejects(call('get',{id:guide.id}),/no disponible/);
 await assert.rejects(call('save',{id:guide.id,title:'Hijack',questions:[question]}),/borradores/);
 await assert.rejects(call('admin_stats'),/administrador/);
 await as('owner');await call('submit',{id:guide.id});
 await assert.rejects(call('moderate',{id:guide.id,status:'published'}),/administrador/);
 await as('admin');assert.equal((await call('profile')).is_admin,true);
 await call('moderate',{id:guide.id,status:'published'});
 await as('other');assert.equal((await call('list')).length,1);
 let voted=await call('answer_vote',{id:guide.id,question_id:question.id,answer:'B'});
 assert.equal(voted.questions[0].answer_community,'B');
 voted=await call('answer_vote',{id:guide.id,question_id:question.id,answer:'B'});
 assert.equal(voted.questions[0].vote_count,1);
 await assert.rejects(call('answer_vote',{id:guide.id,question_id:question.id,answer:'Z'}),/válida/);
 await as('owner');voted=await call('answer_vote',{id:guide.id,question_id:question.id,answer:'A'});
 assert.equal(voted.questions[0].answer_community,'');
 voted=await call('answer_vote',{id:guide.id,question_id:question.id,answer:'B'});
 assert.equal(voted.questions[0].answer_community,'B');assert.equal(voted.questions[0].vote_count,2);
 voted=await call('answer_vote',{id:guide.id,question_id:question.id,answer:null});
 assert.equal(voted.questions[0].vote_count,1);
 await assert.rejects(call('save',{id:guide.id,title:'Changed',questions:[question]}),/borradores/);
 await call('deck_vote',{id:guide.id,value:1});
 assert.equal((await call('deck_vote',{id:guide.id,value:1})).score,1);
 await as('admin');const stats=await call('admin_stats');assert.equal(stats.users,3);assert.equal(stats.published,1);assert.equal(stats.activity_7d.study,1);
 await call('moderate',{id:guide.id,status:'rejected',note:'Revisar'});
 await as('other');await assert.rejects(call('get',{id:guide.id}),/no disponible/);
 await as('owner');const revised=await call('save',{id:guide.id,title:'Revisión',questions:[question]});assert.equal(revised.questions[0].vote_count,0);
 }finally{await db.close();}
});
