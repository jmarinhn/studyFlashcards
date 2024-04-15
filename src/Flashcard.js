import React, { useState, useEffect } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer, questionNumber, totalQuestions }) => {
    const [flipped, setFlipped] = useState(false);  
    const maxQuestions = 60;
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

    // Sort options by letter before displaying
    const sortedOptions = [...options].sort((a, b) => a.letter.localeCompare(b.letter));


    // Function to extract the full answers from the options using the answer letters
    const getFullAnswers = () => {
        return answer.split('').map(letter => 
            options.find(option => option.letter === letter)?.text || ''
        ).join(', ');  // Join the answers with a comma for better readability
    };


    return (
        <div className="flashcard" onClick={() => setFlipped(f => !f)}>
            <div className={`card ${flipped ? 'flipped' : ''}`}>
                <div className="front">
                    <h1 className="question">{question}</h1>
                    <div> <br/> </div>
                    {sortedOptions.map((option, index) => (
                        <p key={index}>{option.letter}: {option.text}</p>
                    ))}
                </div>
                <div className="back">
                    <h1>Answer:</h1>
                    <p>{getFullAnswers()}</p>
                </div>
            </div>
            <div className="question-counter">
                {questionNumber} / {maxQuestions}
            </div>
        </div>
    );
};

export default Flashcard;