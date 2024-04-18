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

/*
  const loadQuestions = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        const parsedQuestions = shuffleArray(Object.keys(jsonContent).map((key) => {
          const options = shuffleOptions(jsonContent[key].options);
          return {
            id: key,
            ...jsonContent[key],
            options: options
          };
        }));
        setQuestions(parsedQuestions);
        localStorage.setItem(`questions_${username}`, JSON.stringify(parsedQuestions));
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsText(file);
  };
*/

  const loadQuestions = (file) => {
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        console.log("Contenido del JSON cargado:", jsonContent); // Log de control
        const allQuestions = shuffleArray(Object.keys(jsonContent).map(key => {
          const options = shuffleOptions(jsonContent[key].options);
          return { id: key, ...jsonContent[key], options };
        }));
        // Asegúrate de cortar el array a maxQuestions
        const selectedQuestions = allQuestions.slice(0, maxQuestions);
        setQuestions(selectedQuestions);
        console.log("Preguntas seleccionadas para esta ronda:", selectedQuestions); // Log de control
      } catch (error) {
        console.error('Error al analizar JSON:', error);
      }
    };
    reader.onerror = error => console.error('Error al leer el archivo:', error);
    reader.readAsText(file);
  };
  
  return [questions, loadQuestions, setCurrentFile, currentFile];
};

export { shuffleArray, useQuestions };
