import React, { useState } from 'react';
import Flashcard from './Flashcard';
import useQuestions from './useQuestions';
import './App.css';

const App = () => {
  const [questions, loadQuestions] = useQuestions();
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleFileAccepted = (file) => {
    setLoading(true);
    loadQuestions(file);
    setTimeout(() => {
      setLoading(false);
      setCurrentQuestionIndex(0);
    }, 3000); // Adjust the countdown time as needed
  };

  return (
    <div className="app">
      {loading ? (
        <Loader type="ThreeDots" color="#00BFFF" height={80} width={80} />
      ) : questions.length > 0 ? (
        <Flashcard
          question={questions[currentQuestionIndex].question}
          options={questions[currentQuestionIndex].options}
          answer={questions[currentQuestionIndex].answer_official}
        />
      ) : (
        <FileDropzone onFileAccepted={handleFileAccepted} />
      )}
    </div>
  );
};

export default App;
