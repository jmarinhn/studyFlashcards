import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import Flashcard from './Flashcard';
import useQuestions from './useQuestions';
import FileDropzone from './FileDropzone';
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

  const handleSwipe = (direction) => {
    // Increment or decrement the current question index based on the swipe direction
    if (direction === 'Right' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'Left' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
  });

  return (
    <div className="app">
      {loading ? (
        <Loader type="ThreeDots" color="#00BFFF" height={80} width={80} />
      ) : questions.length > 0 ? (
        <div {...swipeHandlers}>
          <Flashcard
            key={currentQuestionIndex}
            question={questions[currentQuestionIndex].question}
            options={questions[currentQuestionIndex].options}
            answer={questions[currentQuestionIndex].answer_official}
          />
        </div>
      ) : (
        <FileDropzone onFileAccepted={handleFileAccepted} />
      )}
    </div>
  );
};

export default App;