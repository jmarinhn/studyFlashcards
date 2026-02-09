# Study Flashcards

A flashcard application for studying multiple-choice questions. Supports custom JSON files with questions and answers.

## Features

- **Study Mode**: Freely navigate through questions, flip cards to reveal answers
- **Test Mode**: Grading system with answer validation
- **Multiple Selection Support**: Questions with one or multiple correct answers
- **Shuffled Options**: Options are randomly shuffled while maintaining correct validation
- **Leaderboard**: Score tracking

## JSON Format

```json
{
  "1": {
    "question": "What is the capital of France?",
    "options": {
      "A": "Madrid",
      "B": "Paris",
      "C": "London",
      "D": "Rome"
    },
    "answer_official": "B",
    "answer_community": "B"
  }
}
```

For multiple selection questions, use multiple letters: `"answer_official": "AC"`

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`

Launches the test runner in interactive watch mode

### `npm run build`

Builds the app for production to the `build` folder