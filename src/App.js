import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import FingerprintJS from 'fingerprintjs2';
import Cookies from 'js-cookie';
import Flashcard from './Flashcard';
import useQuestions from './useQuestions';
import FileDropzone from './FileDropzone';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [questions, loadQuestions] = useQuestions();
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const savedIndex = Cookies.get(`currentQuestionIndex_${username}`);
    return savedIndex ? JSON.parse(savedIndex) : 0;
  });
  
  useEffect(() => {
    Cookies.set(`currentQuestionIndex_${username}`, JSON.stringify(currentQuestionIndex));
  }, [currentQuestionIndex]);

  useEffect(() => {
    FingerprintJS.get((components) => {
      const values = components.map((component) => component.value);
      const uniqueHash = FingerprintJS.x64hash128(values.join(''), 31);
      setUsername(uniqueHash);
    });
  }, []);

  const handleFileAccepted = (file) => {
    setLoading(true);
    loadQuestions(file);
    setTimeout(() => {
      setLoading(false);
      setCurrentQuestionIndex(0);
    }, 3000); // Adjust the countdown time as needed
  };

  const handleSwipe = (direction) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (direction === 'Right') {
      // Store the question ID as correct
      localStorage.setItem(`question_${currentQuestion.id}`, 'correct');
    } else if (direction === 'Left') {
      // Store the question ID as incorrect
      localStorage.setItem(`question_${currentQuestion.id}`, 'incorrect');
    }
    // Move to the next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    if (currentQuestionIndex >= questions.length) {
      // Show a message or reset the index
      setCurrentQuestionIndex(0);
    }
  };
  

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        handleSwipe('Right');
      } else if (event.key === 'ArrowLeft') {
        handleSwipe('Left');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions.length]);

  return (
    <div className="app">
      {loading ? (
        <ThreeDots color="#00BFFF" height={80} width={80} />
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