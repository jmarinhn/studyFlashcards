import React, { useState, useEffect } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer, questionNumber, totalQuestions }) => {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === ' ') {
                event.preventDefault();  // Prevent the default action to avoid scrolling
                setFlipped(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Clean up to avoid memory leaks
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flashcard" onClick={() => setFlipped(f => !f)}>
            <div className={`card ${flipped ? 'flipped' : ''}`}>
                <div className="front">
                    <h1>{question}</h1>
                    {options.map((option, index) => (
                        <p key={index}>{option.letter}: {option.text}</p>
                    ))}
                </div>
                <div className="back">
                    <p>Answer: {answer}</p>
                </div>
            </div>
            <div className="question-counter">
                Question {questionNumber} of {totalQuestions}
            </div>
        </div>
    );
};

export default Flashcard;
