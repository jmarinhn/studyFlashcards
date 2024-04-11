import { useState } from 'react';

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
          const parsedQuestions = Object.keys(jsonContent).map((key) => ({
            id: key,
            ...jsonContent[key],
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
  
    return [questions, loadQuestions];
  };
  

export default useQuestions;
