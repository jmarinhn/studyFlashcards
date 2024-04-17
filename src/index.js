import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './vitals';
import { AppRegistry } from 'react-native';


import './index.css';
import App from './App';

// Register the app component for React Native Web
AppRegistry.registerComponent('study-flashcards', () => App);

// Mount the app component to the DOM
AppRegistry.runApplication('study-flashcards', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});


const container = document.getElementById('root');
const root = createRoot(container); // create a root.
root.render(<App />);

reportWebVitals(sendToVercelAnalytics);