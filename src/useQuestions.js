import { useState } from 'react';

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const useQuestions = (username) => {
    const [questions, setQuestions] = useState(() => {
        const savedQuestions = localStorage.getItem(`questions_${username}`);
        return savedQuestions ? JSON.parse(savedQuestions) : [];
    });

    const loadQuestions = (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonContent = JSON.parse(event.target.result);
          const parsedQuestions = Object.keys(jsonContent).map((key) => {
            const options = jsonContent[key].options;
            const shuffledOptions = shuffleArray(Object.entries(options).map(([letter, text]) => ({ letter, text })));
            return {
              id: key,
              ...jsonContent[key],
              options: shuffledOptions // Store shuffled but maintain original letters for display.
            };
          });
          setQuestions(shuffleArray(parsedQuestions));
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

  return [questions, loadQuestions, setQuestions];
};

export default useQuestions;
