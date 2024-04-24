import { useState } from 'react';

// Utility function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Utility function to shuffle options
const shuffleOptions = (options) => {
  let entries = Object.entries(options).map(([letter, text]) => ({ letter, text }));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries;
};

const useQuestions = (username, maxQuestions) => {
  const [questions, setQuestions] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jsonStatus, setJsonStatus] = useState("");

  
  const loadQuestions = (file, callback) => {
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        const allQuestions = Object.keys(jsonContent).map(key => ({
          id: key,
          ...jsonContent[key],
          options: shuffleOptions(jsonContent[key].options)
        }));
        // Log the loaded content for debugging
        console.log("Contenido del JSON cargado:", allQuestions);
        setTotalQuestions(allQuestions.length);  // Update total questions
        const questionsForSession = shuffleArray(allQuestions).slice(0, maxQuestions);
        setQuestions(questionsForSession);
        console.log("Preguntas seleccionadas para esta ronda:", questionsForSession);
        callback(); // Continue after setting questions
      } catch (error) {
        console.error('Error al analizar JSON:', error);
        callback(); // Call callback even on error
      }
    };
    reader.onerror = error => {
      console.error('Error al leer el archivo:', error);
      callback(); // Ensure callback on read error
    };
    reader.readAsText(file);
  };

  return [questions, loadQuestions, setQuestions, totalQuestions, loading, jsonStatus];

};

export { shuffleArray, useQuestions };
