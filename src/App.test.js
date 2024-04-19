import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('updates answer status correctly', () => {
  render(<App />);
  const questionId = 'question1';
  const isCorrect = true;

  fireEvent.click(screen.getByText(/learn react/i));

  // Simulate updating answer status
  App.updateAnswerStatus(questionId, isCorrect);

  // Check if answer status is updated correctly in local storage
  expect(localStorage.getItem(`question_correct_${questionId}`)).toBe('true');
});

test('handles file accepted correctly', () => {
  render(<App />);
  const file = new File(['{}'], 'questions.json', { type: 'application/json' });

  fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });

  // Check if loading state is set to true
  expect(screen.getByText(/Validating JSON.../i)).toBeInTheDocument();

  // Wait for JSON validation to complete
  setTimeout(() => {
    // Check if loading state is set to false
    expect(screen.queryByText(/Validating JSON.../i)).not.toBeInTheDocument();

    // Check if questions are loaded
    expect(screen.getByText(/Total questions detected:/i)).toBeInTheDocument();
  }, 3000);
});

test('handles swipe correctly in test mode', () => {
  render(<App />);
  const direction = 'Right';

  fireEvent.click(screen.getByText(/Test/i));

  // Simulate swipe
  App.handleSwipe(direction);

  // Check if card style is updated correctly
  expect(screen.getByTestId('flashcard')).toHaveStyle({
    transform: `translateX(${direction === 'Right' ? 1000 : -1000}px)`,
    transition: 'transform 0.7s ease-out',
    backgroundColor: direction === 'Right' ? 'lightgreen' : 'lightcoral'
  });

  // Wait for card style to reset
  setTimeout(() => {
    // Check if card style is reset
    expect(screen.getByTestId('flashcard')).not.toHaveStyle({
      transform: expect.any(String),
      transition: expect.any(String),
      backgroundColor: expect.any(String)
    });

    // Check if current question index is updated correctly
    expect(screen.getByTestId('flashcard')).toHaveAttribute('questionNumber', '2');

    // Check if correct count is updated correctly
    expect(screen.getByText(/Correct Answers:/i)).toHaveTextContent('1');

    // Check if incorrect count is updated correctly
    expect(screen.getByText(/Incorrect Answers:/i)).toHaveTextContent('0');
  }, 300);
});

test('handles retry correctly', () => {
  render(<App />);
  const retryIncorrect = true;

  fireEvent.click(screen.getByText(/Test/i));

  // Simulate retry
  App.handleRetry(retryIncorrect);

  // Check if questions are shuffled and filtered correctly
  expect(screen.getByTestId('flashcard')).toHaveAttribute('questionNumber', '1');

  // Check if correct count is reset
  expect(screen.getByText(/Correct Answers:/i)).toHaveTextContent('0');

  // Check if incorrect count is reset
  expect(screen.getByText(/Incorrect Answers:/i)).toHaveTextContent('0');

  // Check if show results state is set to false
  expect(screen.queryByText(/Results/i)).not.toBeInTheDocument();
});

test('handles finish correctly', () => {
  render(<App />);

  fireEvent.click(screen.getByText(/Test/i));

  // Simulate finish
  App.handleFinish();

  // Check if show results state is set to false
  expect(screen.queryByText(/Results/i)).not.toBeInTheDocument();

  // Check if current question index is reset
  expect(screen.getByTestId('flashcard')).toHaveAttribute('questionNumber', '1');

  // Check if correct count is reset
  expect(screen.getByText(/Correct Answers:/i)).toHaveTextContent('0');

  // Check if incorrect count is reset
  expect(screen.getByText(/Incorrect Answers:/i)).toHaveTextContent('0');

  // Check if questions are cleared from state
  expect(App.questions).toHaveLength(0);

  // Check if local storage is cleared
  expect(localStorage.length).toBe(0);
});

test('handles mode select correctly', () => {
  render(<App />);
  const selectedMode = 'study';

  fireEvent.click(screen.getByText(/Study/i));

  // Check if mode is updated correctly
  expect(App.mode).toBe(selectedMode);

  // Check if questions are shuffled correctly
  expect(App.questions).not.toEqual(App.shuffleArray(App.questions));

  // Check if current question index is reset
  expect(screen.getByTestId('flashcard')).toHaveAttribute('questionNumber', '1');

  // Check if swipe count is reset
  expect(App.swipeCount).toBe(0);

  // Check if correct count is reset
  expect(screen.getByText(/Correct Answers:/i)).toHaveTextContent('0');

  // Check if incorrect count is reset
  expect(screen.getByText(/Incorrect Answers:/i)).toHaveTextContent('0');

  // Check if show results state is set to false
  expect(screen.queryByText(/Results/i)).not.toBeInTheDocument();
});