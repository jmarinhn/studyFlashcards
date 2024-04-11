import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

const Flashcard = ({ question, options, answer, onFlip }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onFlip}>
      <Text style={styles.question}>{question}</Text>
      {Object.entries(options).map(([key, value]) => (
        <Text key={key} style={styles.option}>
          {key}: {value}
        </Text>
      ))}
      <Text style={styles.answer}>Answer: {answer}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    fontSize: 16,
    marginBottom: 5,
  },
  answer: {
    fontSize: 16,
    marginTop: 10,
    color: 'red',
  },
});

export default Flashcard;
