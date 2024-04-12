import React, { useState } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer, questionNumber, totalQuestions }) => {
    const [flipped, setFlipped] = useState(false);

    const flipCard = () => {
        setFlipped(!flipped);
    };

    return (
        <div className="flashcard" onClick={flipCard}>
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
