import { useState } from 'react';
import * as FileSystem from 'react-native-fs';

const useQuestions = (fileUri) => {
  const [questions, setQuestions] = useState([]);

  const loadQuestions = async () => {
    try {
      const fileContent = await FileSystem.readFile(fileUri);
      const jsonContent = JSON.parse(fileContent);
      const parsedQuestions = Object.keys(jsonContent).map((key) => ({
        id: key,
        ...jsonContent[key],
      }));
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  return [questions, loadQuestions];
};

export default useQuestions;