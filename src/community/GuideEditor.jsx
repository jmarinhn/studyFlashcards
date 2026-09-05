import React, { useRef, useState } from 'react';
import { importDeck } from '../utils/deckSharing';
import { newGuide, newQuestion, validateGuide } from './deckModel';

export default function GuideEditor({ initial, onSave, onCancel }) {
  const [guide, setGuide] = useState(() => initial || newGuide());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const updateQuestion = (index, patch) => setGuide(prev => ({ ...prev, questions: prev.questions.map((q,i) => i===index ? { ...q,...patch } : q) }));
  const save = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onSave({ ...validateGuide(guide), id: guide.id }); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const importFile = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size>2000000) throw new Error('El archivo debe ser menor de 2 MB.');
      const imported = importDeck(JSON.parse(await file.text()),file.name.replace(/\.json$/i,''));
      const questions = imported.questions.map(q => ({ ...q, id: crypto.randomUUID() }));
      const candidate = { ...imported, questions };
      validateGuide(candidate);
      setGuide({ ...candidate, id: guide.id }); setError('');
    } catch(e) { setError(e.message); }
    event.target.value='';
  };
  return <form className="guide-editor" onSubmit={save}>
    <div className="community-heading"><div><span className="community-eyebrow">TU ESPACIO DE ESTUDIO</span><h2>{guide.id ? 'Editar guía' : 'Crear guía de estudio'}</h2><p>Escribe tus preguntas, marca las respuestas y explica el porqué.</p></div></div>
    {error && <p className="community-message" role="alert">{error}</p>}
    <fieldset disabled={busy}>
      <label>Título<input required maxLength={160} value={guide.title} onChange={e=>setGuide({...guide,title:e.target.value})} placeholder="Ej. Redes de Google Cloud" /></label>
      <label>Descripción<textarea maxLength={2000} value={guide.description} onChange={e=>setGuide({...guide,description:e.target.value})} placeholder="Qué aprenderán y a quién va dirigida esta guía" /></label>
      <div className="community-actions"><button type="button" onClick={()=>fileRef.current.click()}>Importar JSON en el editor</button><span>Reemplaza el contenido del editor. Máximo 200 preguntas.</span></div>
      <input hidden type="file" accept=".json,application/json" ref={fileRef} onChange={importFile}/>
      {guide.questions.map((q,index)=><article className="community-question" key={q.id}>
        <div className="community-heading"><h3>Pregunta {index+1}</h3><button type="button" disabled={guide.questions.length===1} onClick={()=>setGuide({...guide,questions:guide.questions.filter((_,i)=>i!==index)})}>Quitar pregunta</button></div>
        <label>Enunciado<textarea required maxLength={5000} value={q.question} onChange={e=>updateQuestion(index,{question:e.target.value})}/></label>
        <p className="community-hint">Marca todas las opciones correctas. Se admiten respuestas múltiples.</p>
        {q.options.map((opt,oi)=><div className="editor-option" key={opt.letter}>
          <label className="option-check"><input type="checkbox" aria-label={`Pregunta ${index+1}: ${opt.letter} correcta`} checked={q.answer_official.includes(opt.letter)} onChange={e=>updateQuestion(index,{answer_official:e.target.checked ? [...q.answer_official,opt.letter].sort().join('') : q.answer_official.replace(opt.letter,'')})}/>{opt.letter}</label>
          <input aria-label={`Pregunta ${index+1}: opción ${opt.letter}`} maxLength={2000} value={opt.text} onChange={e=>updateQuestion(index,{options:q.options.map((o,i)=>i===oi?{...o,text:e.target.value}:o)})}/>
        </div>)}
        {q.options.length<6 && <button type="button" onClick={()=>updateQuestion(index,{options:[...q.options,{letter:String.fromCharCode(65+q.options.length),text:''}]})}>Añadir opción</button>}
        <label>Explicación<textarea maxLength={10000} value={q.explanation} onChange={e=>updateQuestion(index,{explanation:e.target.value})} placeholder="Incluye una explicación o referencia para ayudar a estudiar."/></label>
      </article>)}
      <div className="community-actions"><button type="button" disabled={guide.questions.length>=200} onClick={()=>setGuide({...guide,questions:[...guide.questions,newQuestion()]})}>＋ Añadir pregunta</button><button className="community-primary" type="submit">{busy?'Guardando…':'Guardar borrador'}</button><button type="button" onClick={onCancel}>Cancelar</button></div>
    </fieldset>
  </form>;
}
