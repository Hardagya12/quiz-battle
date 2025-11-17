const QuestionCard = ({ question, options, selectedAnswer, hasAnswered, onAnswer }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
      <div className="mb-8 text-center">
        <h3 className="text-2xl text-gray-800 leading-relaxed">{question}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

          return (
            <button
              key={index}
              className={`flex items-center gap-4 p-5 bg-gray-50 border-2 rounded-xl transition-all text-left text-base ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 font-semibold"
                  : "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"
              } ${hasAnswered ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => !hasAnswered && onAnswer(option)}
              disabled={hasAnswered}
            >
              <span className="flex items-center justify-center w-10 h-10 bg-indigo-500 text-white rounded-full font-bold flex-shrink-0">
                {optionLetter}
              </span>
              <span className="flex-1 text-gray-800">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;

