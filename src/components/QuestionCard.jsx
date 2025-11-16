import "./QuestionCard.css";

const QuestionCard = ({ question, options, selectedAnswer, hasAnswered, onAnswer }) => {
  return (
    <div className="question-card">
      <div className="question-text">
        <h3>{question}</h3>
      </div>
      <div className="options-grid">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

          return (
            <button
              key={index}
              className={`option-button ${isSelected ? "selected" : ""} ${
                hasAnswered ? "answered" : ""
              }`}
              onClick={() => !hasAnswered && onAnswer(option)}
              disabled={hasAnswered}
            >
              <span className="option-letter">{optionLetter}</span>
              <span className="option-text">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;

