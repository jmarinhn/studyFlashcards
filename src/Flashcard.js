import React, { useState, useEffect } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer, questionNumber, totalQuestions }) => {
    const [flipped, setFlipped] = useState(false);

    // Helper function to shuffle array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    };

    // Convert and shuffle options object into an array of objects with letter and text properties
    const shuffledOptions = shuffleArray(Object.entries(options).map(([letter, text]) => ({
            letter,
            text
    })));

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

    // Sort the shuffled options by letter to ensure A>Z order for display
    const sortedOptions = shuffledOptions.sort((a, b) => a.letter.localeCompare(b.letter));

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
                    <h1>{question}</h1>
                    {sortedOptions.map((option, index) => (
                        <p key={index}>{option.letter}: {option.text}</p>
                    ))}
                </div>
                <div className="back">
                    <p>Answer: {getFullAnswers()}</p>
                </div>
            </div>
            <div className="question-counter">
                {questionNumber} / {totalQuestions}
            </div>
        </div>
    );
};

export default Flashcard;
