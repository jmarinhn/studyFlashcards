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

    // Ensure options is an object and convert it to a sorted array
    const sortedOptions = options && typeof options === 'object'
        ? Object.entries(options).sort((a, b) => a[0].localeCompare(b[0]))
        : [];

    // Map the 'answer' string to the corresponding options text
    const processedAnswer = answer
        ? answer.split('').map(letter => `${letter}: ${options[letter]}`).join(', ')
        : 'No answer provided';

    return (
        <div className="flashcard" onClick={() => setFlipped(f => !f)}>
            <div className={`card ${flipped ? 'flipped' : ''}`}>
                <div className="front">
                    <h1>{question}</h1>
                    {sortedOptions.map(([letter, text], index) => (
                        <p key={index}>{letter}: {text}</p>
                    ))}
                </div>
                <div className="back">
                    <p>Answer: {processedAnswer}</p>
                </div>
            </div>
            <div className="question-counter">
                 {questionNumber} / 60
            </div>
        </div>
    );
};

export default Flashcard;
