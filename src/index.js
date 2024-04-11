import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './vitals';
import { AppRegistry } from 'react-native';

// Register the app component for React Native Web
AppRegistry.registerComponent('study-flashcards', () => App);

// Mount the app component to the DOM
AppRegistry.runApplication('study-flashcards', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals(sendToVercelAnalytics);