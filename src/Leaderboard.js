import React, { useState } from 'react';

const Leaderboard = ({ data, userTime, onAddToLeaderboard }) => {
  const [nameToAdd, setNameToAdd] = useState('');
  const [allowAdd, setAllowAdd] = useState(false);

  // Suponiendo que data ya está ordenada por score de menor a mayor
  const worstTime = data.length > 0 ? data[data.length - 1].score : null;

  // Verificar si el usuario puede ser añadido
  const checkIfCanAdd = () => {
    if (userTime < worstTime || data.length < 10) {
      setAllowAdd(true);
    }
  };

  // Manejar la adición del usuario a la leaderboard
  const handleAddUser = () => {
    if (nameToAdd && allowAdd) {
      onAddToLeaderboard({ name: nameToAdd, score: userTime });
      setNameToAdd('');
      setAllowAdd(false);
    } else {
      alert('Your time is not good enough to enter the leaderboard!');
    }
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <ol>
        {data.map((entry, index) => (
          <li key={index}>{entry.name}: {entry.score}</li>
        ))}
      </ol>
      {allowAdd && (
        <div>
          <input
            type="text"
            value={nameToAdd}
            onChange={(e) => setNameToAdd(e.target.value)}
            placeholder="Enter your name"
          />
          <button onClick={handleAddUser}>Add to Leaderboard</button>
        </div>
      )}
      <button onClick={checkIfCanAdd}>Check if you can be added</button>
    </div>
  );
};

export default Leaderboard;
