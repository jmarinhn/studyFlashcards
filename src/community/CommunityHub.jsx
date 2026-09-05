import React, { useEffect, useState } from 'react';
import { communityApi, communityClient } from './client';
import GuideEditor from './GuideEditor';
import { guideToStudyDeck } from './deckModel';
import { downloadDeck } from '../utils/deckSharing';
import MarkdownText from '../components/MarkdownText';
import './CommunityHub.css';
const statusNames = { draft:'Borrador',pending:'En revisión',published:'Publicado',rejected:'Requiere cambios' };

function QuestionDiscussion({ question:q, onVote, busy }) {
  const [answer,setAnswer]=useState(q.my_answer || '');
  useEffect(()=>setAnswer(q.my_answer || ''),[q.id,q.my_answer]);
  return <article className="community-question">
    <h3><MarkdownText text={q.question}/></h3>
    <div className="community-options">{q.options.map(o=><label key={o.letter}>
      <input type="checkbox" disabled={busy} checked={answer.includes(o.letter)} onChange={e=>setAnswer(e.target.checked?[...answer,o.letter].sort().join(''):answer.replace(o.letter,''))}/><strong>{o.letter}.</strong> <MarkdownText text={o.text}/>
    </label>)}</div>
    <p><strong>Respuesta del autor:</strong> {q.answer_official} · <strong>Comunidad:</strong> {q.answer_community || 'Sin consenso'} ({q.vote_count} votos)</p>
    {q.explanation && <div className="community-explanation"><MarkdownText text={q.explanation}/></div>}
    <div className="community-actions"><button disabled={busy||!answer} onClick={()=>onVote(q.id,answer)}>Votar {answer || 'respuesta'}</button><button disabled={busy} onClick={()=>onVote(q.id,q.answer_official)}>De acuerdo con el autor</button>{q.my_answer && <button disabled={busy} onClick={()=>onVote(q.id,null)}>Retirar mi voto</button>}</div>
    <p className="community-hint">¿No estás de acuerdo? Marca la combinación que consideras correcta y vota. Un voto por cuenta, modificable.</p>
    <div className="community-distribution">{Object.entries(q.distribution||{}).map(([a,n])=><span key={a}>{a}: {n}</span>)}</div>
  </article>;
}

export default function CommunityHub({ user, onLogin, onBack, onStudy, initialGuide }) {
  const [scope,setScope]=useState(initialGuide?'mine':'public');
  const [profile,setProfile]=useState(null);
  const [rows,setRows]=useState([]);
  const [detail,setDetail]=useState(null);
  const [editor,setEditor]=useState(initialGuide||null);
  const [stats,setStats]=useState(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [offset,setOffset]=useState(0);
  const [refresh,setRefresh]=useState(0);
  const [note,setNote]=useState('');
  const [shareUrl,setShareUrl]=useState('');
  const [detailPage,setDetailPage]=useState(0);
  useEffect(()=>{
    if(!communityClient||!user?.cloud) return;
    let active=true;
    setLoading(true); setError('');
    Promise.all([communityApi('profile'),scope==='admin'?communityApi('admin_stats',{offset}):communityApi('list',{scope,offset})])
      .then(([p,data])=>{if(active){setProfile(p);if(scope==='admin')setStats(data);else setRows(data);}})
      .catch(e=>{if(active)setError(e.message);})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[user?.id,user?.cloud,scope,offset,refresh]);
  useEffect(()=>{
    if(!user?.cloud||!communityClient) return;
    const id=new URLSearchParams(window.location.search).get('deck');
    if(id) { setLoading(true); communityApi('get',{id}).then(setDetail).catch(e=>setError(e.message)).finally(()=>setLoading(false)); }
  },[user?.id,user?.cloud]);
  const run=async(fn)=>{setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
  const open=async(id)=>{await run(async()=>{setDetail(await communityApi('get',{id}));setDetailPage(0);setShareUrl('');setNote('');});};
  const changeScope=(next)=>{setScope(next);setDetail(null);setEditor(null);setOffset(0);setNotice('');setError('');};
  const update=async(action,payload)=>run(async()=>{setDetail(await communityApi(action,{id:detail.id,...payload}));setRefresh(x=>x+1);});
  const share=()=>run(async()=>{
    const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('deck',detail.id);setShareUrl(url.toString());
    try {await navigator.clipboard.writeText(url.toString());setNotice('Enlace copiado. Quien lo abra podrá iniciar sesión para ver la guía.');} catch {setNotice('Copia el enlace que aparece debajo.');}
  });
  return <section className="community-hub">
    <header className="community-heading"><div><span className="community-eyebrow">APRENDE Y COMPARTE</span><h1>Community Decks</h1><p>Guías creadas por estudiantes, revisadas y mejoradas entre todos.</p></div><button onClick={onBack}>← Mis tarjetas</button></header>
    {!communityClient ? <div className="community-empty"><h2>La comunidad está en preparación</h2><p>El servicio de cuentas y guías aún no está conectado. Tus mazos locales siguen disponibles.</p></div>
    : !user?.cloud ? <div className="community-empty"><h2>Tu próxima guía empieza aquí</h2><p>Inicia sesión con Google para crear guías, compartirlas y votar las respuestas de la comunidad.</p><button className="community-primary" onClick={onLogin}>Continuar con Google</button></div>
    : <>
      <nav className="community-tabs" aria-label="Secciones de comunidad">
        {[['public','Community Decks'],['mine','Mis guías'],...(profile?.is_admin?[['moderation','Revisar mazos'],['admin','Administración']]:[])].map(([value,label])=><button key={value} aria-pressed={scope===value} disabled={busy} onClick={()=>changeScope(value)}>{label}</button>)}
        <button className="community-primary" disabled={busy} onClick={()=>{setEditor({title:'',description:'',questions:[]});setDetail(null);}}>＋ Crear guía</button>
      </nav>
      {error&&<p className="community-message" role="alert">{error} <button onClick={()=>setRefresh(x=>x+1)}>Reintentar carga</button></p>}
      {notice&&<p className="community-message" role="status">{notice}</p>}
      {loading&&<p role="status">Cargando comunidad…</p>}
      {editor ? <GuideEditor key={editor.id||'new'} initial={editor.questions.length?editor:undefined} onCancel={()=>setEditor(null)} onSave={async guide=>{const saved=await communityApi('save',guide);setEditor(null);setDetail(saved);setScope('mine');setNotice('Borrador guardado en tu cuenta. Puedes estudiarlo o enviarlo a revisión.');setRefresh(x=>x+1);}}/>
      : detail ? <>
        <div className="community-heading"><div><span className="community-status">{statusNames[detail.status]}</span><h2>{detail.title}</h2><p>{detail.description}</p><p>Por {detail.author} · {detail.questions.length} preguntas</p></div><button onClick={()=>{setDetail(null);const url=new URL(location.href);url.searchParams.delete('deck');history.replaceState(null,'',url);}}>← Volver al catálogo</button></div>
        {detail.moderation_note&&<p className="community-message">Nota de revisión: {detail.moderation_note}</p>}
        <div className="community-actions">
          <button className="community-primary" onClick={()=>onStudy(guideToStudyDeck(detail))}>Estudiar guía</button>
          <button onClick={()=>run(async()=>{downloadDeck(guideToStudyDeck(detail));await communityApi('activity',{kind:'download',deck_id:detail.id});})}>Descargar JSON</button>
          {detail.status==='published'&&<><button onClick={share}>Copiar enlace</button><button disabled={busy} aria-pressed={detail.my_vote===1} onClick={()=>update('deck_vote',{value:detail.my_vote===1?null:1})}>👍 Útil</button><button disabled={busy} aria-pressed={detail.my_vote===-1} onClick={()=>update('deck_vote',{value:detail.my_vote===-1?null:-1})}>👎 Necesita mejorar</button><span>Valoración: {detail.score}</span></>}
          {detail.owner_id===user.id&&['draft','rejected'].includes(detail.status)&&<><button disabled={busy} onClick={()=>setEditor(detail)}>Editar</button><button disabled={busy} onClick={()=>update('submit',{})}>Enviar a revisión</button></>}
          {detail.owner_id===user.id&&['pending','published'].includes(detail.status)&&<button onClick={()=>setEditor({...detail,id:undefined,title:`${detail.title.slice(0,140)} · nueva versión`,questions:detail.questions.map(q=>({...q,id:crypto.randomUUID()}))})}>Crear nueva versión</button>}
        </div>
        {shareUrl&&<label>Enlace para compartir<input readOnly value={shareUrl} onFocus={e=>e.target.select()}/></label>}
        {profile?.is_admin&&['pending','published'].includes(detail.status)&&<div className="community-moderation"><h3>Revisión administrativa</h3><label>Comentarios de revisión<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2000}/></label><div className="community-actions">{detail.status==='pending'&&<button disabled={busy} onClick={()=>update('moderate',{status:'published',note})}>Aprobar y publicar</button>}<button disabled={busy||!note.trim()} onClick={()=>update('moderate',{status:'rejected',note})}>Devolver con comentarios</button></div></div>}
        <p className="community-hint">La respuesta comunitaria requiere más del 50 % de los votos. Sin consenso se utiliza la respuesta del autor al estudiar.</p>
        {detail.questions.slice(detailPage*10,(detailPage+1)*10).map(q=>detail.status==='published'?<QuestionDiscussion key={q.id} question={q} busy={busy} onVote={(question_id,answer)=>update('answer_vote',{question_id,answer})}/>:<article className="community-question" key={q.id}><h3><MarkdownText text={q.question}/></h3>{q.options.map(o=><p key={o.letter}>{o.letter}. {o.text}</p>)}<p>Respuesta: {q.answer_official}</p><MarkdownText text={q.explanation}/></article>)}
        <div className="community-actions"><button disabled={detailPage===0} onClick={()=>setDetailPage(x=>x-1)}>Preguntas anteriores</button><span>Página {detailPage+1} de {Math.ceil(detail.questions.length/10)}</span><button disabled={(detailPage+1)*10>=detail.questions.length} onClick={()=>setDetailPage(x=>x+1)}>Más preguntas</button></div>
      </> : scope==='admin'&&stats ? <>
        <div className="community-stat-grid">{[['users','Usuarios registrados'],['active_7d','Activos · 7 días'],['decks','Guías creadas'],['pending','Por revisar'],['published','Publicadas'],['answer_votes','Votos en respuestas']].map(([key,label])=><article key={key}><strong>{stats[key]}</strong><span>{label}</span></article>)}</div>
        <p>Últimos 7 días: {stats.activity_7d.study||0} inicios de estudio · {stats.activity_7d.exam||0} inicios de examen · {stats.activity_7d.download||0} descargas registradas.</p><p className="community-hint">Actividad de cuentas conectadas desde la activación de la comunidad. Se cuenta como máximo un evento de cada tipo por usuario y minuto.</p>
        <div className="community-table"><table><caption>Usuarios registrados</caption><thead><tr><th>Nombre</th><th>Correo</th><th>Registro</th><th>Última actividad</th></tr></thead><tbody>{stats.members.map(m=><tr key={m.email}><td>{m.display_name}</td><td>{m.email}</td><td>{new Date(m.created_at).toLocaleDateString()}</td><td>{new Date(m.last_seen_at).toLocaleString()}</td></tr>)}</tbody></table></div>
      </> : !loading&&<><div className="community-grid">{rows.map(d=><article className="community-deck" key={d.id}><span className="community-status">{statusNames[d.status]}</span><h2>{d.title}</h2><p>{d.description}</p><p>{d.question_count} preguntas · {d.author}</p><button disabled={busy} onClick={()=>open(d.id)}>Abrir guía →</button></article>)}</div>{rows.length===0&&<div className="community-empty"><h2>{scope==='mine'?'Todavía no has creado guías':'No hay guías en esta sección'}</h2><p>{scope==='mine'?'Crea tu primera guía o importa un JSON en el editor.':'Las guías aparecerán aquí después de su revisión.'}</p></div>}</>}
      {!detail&&!editor&&<div className="community-actions"><button disabled={offset===0||loading} onClick={()=>setOffset(x=>Math.max(0,x-50))}>Anterior</button><span>Página {offset/50+1}</span><button disabled={loading||(scope==='admin'?stats?.members.length:rows.length)<50} onClick={()=>setOffset(x=>x+50)}>Siguiente</button></div>}
    </>}
  </section>;
}
