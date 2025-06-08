import React, { useState, useEffect } from 'react';

const QuestionView = ({ question, timeLeft, setTimeLeft, onSubmitAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, selectedAnswer, setTimeLeft]);

  const handleSelectAnswer = (answer) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(answer);
    onSubmitAnswer(answer);
  };

  const handleTextSubmit = () => {
    const answer = textAnswer.trim();
    if (answer && selectedAnswer === null) {
      setSelectedAnswer(answer);
      onSubmitAnswer(answer);
    }
  };

  const getTimerClass = () => {
    if (timeLeft <= 5) return 'timer timer-danger';
    if (timeLeft <= 10) return 'timer timer-warning';
    return 'timer timer-safe';
  };

  if (!question) return null;

  return (
    <div className="card">
      <div className={getTimerClass()}>
        {timeLeft > 0 ? `⏰ ${timeLeft}s` : "⏰ Time's up!"}
      </div>

      <div className="question-card">
        <div className="question-text">
          {question.question}
        </div>
      </div>

      {question.type === 'multiple_choice' && (
        <div>
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`btn btn-option ${selectedAnswer === option ? 'selected' : ''}`}
              onClick={() => handleSelectAnswer(option)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div>
          <button
            className={`btn btn-option ${selectedAnswer === 'true' ? 'selected' : ''}`}
            onClick={() => handleSelectAnswer('true')}
            disabled={selectedAnswer !== null}
          >
            True
          </button>
          <button
            className={`btn btn-option ${selectedAnswer === 'false' ? 'selected' : ''}`}
            onClick={() => handleSelectAnswer('false')}
            disabled={selectedAnswer !== null}
          >
            False
          </button>
        </div>
      )}

      {question.type === 'text_input' && (
        <div>
          <input
            type="text"
            className="input"
            placeholder="Type your answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={selectedAnswer !== null}
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
          />
          <button
            className="btn btn-primary"
            onClick={handleTextSubmit}
            disabled={!textAnswer.trim() || selectedAnswer !== null}
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionView;