import React, { useState, useEffect } from 'react';

const QuestionView = ({ question, timeLeft, setTimeLeft, onSubmitAnswer, hints = [] }) => {
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

  const renderAnswerOptions = () => {
    if (question.type === 'multiple_choice') {
      return question.options.map((option, index) => (
        <button
          key={index}
          className={`btn btn-option ${selectedAnswer === option ? 'selected' : ''}`}
          onClick={() => handleSelectAnswer(option)}
          disabled={selectedAnswer !== null}
        >
          {option}
        </button>
      ));
    } else if (question.type === 'true_false') {
      return (
        <>
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
        </>
      );
    } else {
      // text_input type - you'd need to add an input field
      return (
        <div>
          <input
            type="text"
            className="input"
            placeholder="Type your answer..."
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
      );
    }
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

      {/* Display hints if any */}
      {hints && hints.length > 0 && (
        <div style={{
          background: 'rgba(255, 235, 59, 0.9)',
          padding: '16px',
          borderRadius: '12px',
          margin: '16px 0',
          border: '2px solid #ffc107'
        }}>
          <h4 style={{ color: '#333', marginBottom: '12px' }}>💡 Hints:</h4>
          {hints.map((hint, index) => (
            <div key={index} style={{
              color: '#333',
              marginBottom: '8px',
              fontSize: '1rem'
            }}>
              <strong>{index + 1}.</strong> {hint}
            </div>
          ))}
        </div>
      )}

      <div>
        {renderAnswerOptions()}
      </div>
    </div>
  );
};

export default QuestionView;