import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import CommunityHub from '../../src/community/CommunityHub';
import '../../src/index.css';
const actors={owner:'11111111-1111-4111-8111-111111111111',other:'22222222-2222-4222-8222-222222222222',admin:'33333333-3333-4333-8333-333333333333'};
function TestApp(){
 const [actor,setActor]=useState(sessionStorage.getItem('test-actor')||'owner');
 const [studied,setStudied]=useState('');
 return <><div style={{padding:16,border:'2px dashed orange'}}>ENTORNO DE PRUEBA AISLADO · Cuentas simuladas · <label>Cuenta de prueba <select value={actor} onChange={e=>{sessionStorage.setItem('test-actor',e.target.value);setActor(e.target.value);}}>{Object.keys(actors).map(a=><option key={a}>{a}</option>)}</select></label>{studied&&<p role="status">Guía seleccionada para estudiar: {studied}</p>}</div><CommunityHub key={actor} user={{id:actors[actor],cloud:true}} onLogin={()=>{}} onBack={()=>{}} onStudy={d=>setStudied(d.title)}/></>;
}
createRoot(document.getElementById('root')).render(<TestApp/>);
