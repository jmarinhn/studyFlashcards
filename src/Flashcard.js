import React, { useState } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer }) => {
    const [flipped, setFlipped] = useState(false);

    const flipCard = () => {
        setFlipped(!flipped);
    };

    return (
        <div className="flashcard" onClick={flipCard}>
            <div className={`card ${flipped ? 'flipped' : ''}`}>
                <div className="front">
                    <h1>{question}</h1>
                    {Object.entries(options).map(([key, value]) => (
                        // Ensure value is a string or convert it safely
                        <p key={key}>{key}: {typeof value === 'string' ? value : JSON.stringify(value)}</p>
                    ))}
                </div>
                <div className="back">
                    <p>Answer: {answer}</p>
                </div>
            </div>
        </div>
    );
};    

export default Flashcard;
