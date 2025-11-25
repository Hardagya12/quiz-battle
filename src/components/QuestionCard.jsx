import { motion } from "framer-motion";

const QuestionCard = ({ question, options, selectedAnswer, hasAnswered, onAnswer }) => {
  return (
    <motion.div 
      className="bg-neo-white p-8 border-3 border-neo-black shadow-neo-xl mb-8 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {/* Retro Decorative Bar */}
      <div className="absolute top-0 left-0 w-full h-4 bg-neo-black flex items-center px-2 gap-2">
        <div className="w-2 h-2 bg-neo-primary rounded-full"></div>
        <div className="w-2 h-2 bg-neo-secondary rounded-full"></div>
        <div className="w-2 h-2 bg-neo-accent rounded-full"></div>
      </div>

      <motion.div 
        className="mt-4 mb-8 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl md:text-2xl text-neo-black font-pixel leading-relaxed">{question}</h3>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

          return (
            <motion.button
              key={index}
              className={`flex items-center gap-4 p-5 transition-all text-left text-base border-3 border-neo-black shadow-neo-sm ${
                isSelected
                  ? "bg-neo-primary text-neo-black shadow-neo translate-x-1 translate-y-1"
                  : "bg-neo-bg text-neo-black hover:bg-neo-secondary hover:shadow-neo hover:-translate-y-1"
              } ${hasAnswered ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => !hasAnswered && onAnswer(option)}
              disabled={hasAnswered}
              whileHover={!hasAnswered ? { scale: 1.02 } : {}}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <span className={`flex items-center justify-center w-10 h-10 border-3 border-neo-black font-bold flex-shrink-0 ${
                isSelected ? "bg-neo-black text-neo-white" : "bg-neo-white text-neo-black"
              }`}>
                {optionLetter}
              </span>
              <span className="flex-1 font-mono font-bold">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuestionCard;

