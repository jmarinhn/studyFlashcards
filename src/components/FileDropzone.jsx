import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { importDeck } from '../utils/deckSharing';
import './FileDropzone.css';

export default function FileDropzone({ onDeckLoaded, onCancel }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        onDeckLoaded(importDeck(json, file.name.replace(/\.[^/.]+$/, '')));
        setIsProcessing(false);
      } catch (err) {
        setErrorMsg('Error al leer el archivo JSON: ' + err.message);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('No se pudo leer el archivo seleccionado.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/json': ['.json'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    onDropRejected: () => {
      setErrorMsg('Por favor selecciona un archivo en formato .json válido.');
    },
  });

  return (
    <div className="dropzone-modal-overlay">
      <div className="dropzone-modal-card">
        <div className="dropzone-header">
          <span className="dropzone-badge">Cargar Mazo</span>
          <h3>Importar Archivo JSON</h3>
          <p>Importa tus preguntas o un mazo JSON compartido por otra persona.</p>
        </div>

        <div
          {...getRootProps()}
          className={`dropzone-drop-area ${isDragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-icon">{isDragActive ? '📥' : '📄'}</div>
          <p className="dropzone-primary-text">
            {isDragActive
              ? '¡Suelta el archivo aquí!'
              : 'Arrastra tu archivo .json aquí'}
          </p>
          <span className="dropzone-browse-btn">O haz clic para seleccionar</span>
        </div>

        {errorMsg && (
          <div className="dropzone-error-box">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <div className="dropzone-sample-format">
          <strong>Formato compatible:</strong>
          <code>
            {`{
  "1": {
    "question": "¿Pregunta?",
    "options": { "A": "Opción 1", "B": "Opción 2" },
    "answer_official": "B"
  }
}`}
          </code>
        </div>

        <div className="dropzone-actions">
          {onCancel && (
            <button className="dropzone-cancel-btn" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
