import React, { useState } from 'react';
import './App.css';
import { View, ScrollView } from 'react-native';
import UploadJson from './UploadJson';
import Flashcard from './Flashcard';
import useQuestions from './useQuestions';

export default function App() {
  const [fileUri, setFileUri] = useState(null);
  const [questions, loadQuestions] = useQuestions(fileUri);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <UploadJson onFileSelected={(uri) => {
        setFileUri(uri);
        loadQuestions();
      }} />
      <ScrollView>
        {questions.map((question) => (
          <Flashcard
            key={question.id}
            question={question.question}
            options={question.options}
            answer={question.answer_official}
          />
        ))}
      </ScrollView>
    </View>
  );
}