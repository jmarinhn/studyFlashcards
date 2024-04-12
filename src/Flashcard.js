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
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Ensure options is in the correct format and sorted
    const optionsArray = options ? Object.entries(options).sort((a, b) => a[0].localeCompare(b[0])) : [];

    // Prepare the display of answers based on the letters in 'answer_official'
    const processedAnswer = answer.split('').map(letter => `${letter}: ${options[letter]}`).join(', ');

    return (
        <div className="flashcard" onClick={() => setFlipped(f => !f)}>
            <div className={`card ${flipped ? 'flipped' : ''}`}>
                <div className="front">
                    <h1>{question}</h1>
                    {optionsArray.map(([letter, text], index) => (
                        <p key={index}>{letter}: {text}</p>
                    ))}
                </div>
                <div className="back">
                    <h1>Answer</h1>
                    <p>{processedAnswer}</p>
                </div>
            </div>
            <div className="question-counter">
                {questionNumber} / {totalQuestions}
            </div>
        </div>
    );
};

export default Flashcard;
