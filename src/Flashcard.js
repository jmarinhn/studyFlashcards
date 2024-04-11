import React, { useState } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, options, answer }) => {
    const [flipped, setFlipped] = useState(false);
  
    return (
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="front">
          <p>{question}</p>
          {Object.entries(options).map(([key, value]) => (
            <p key={key}>{key}: {value}</p>
          ))}
        </div>
        <div className="back">
          <p>Answer: {answer}</p>
        </div>
      </div>
    );
};
  
export default Flashcard;
