const PlayerStatus = ({ player1Answered, player2Answered, isPlayer1 }) => {
  const currentPlayerAnswered = isPlayer1 ? player1Answered : player2Answered;
  const opponentAnswered = isPlayer1 ? player2Answered : player1Answered;

  return (
    <div className="flex justify-around gap-4 mb-6 p-4 bg-gray-50 rounded-lg flex-col md:flex-row">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 justify-center ${
        currentPlayerAnswered 
          ? "bg-green-100 text-green-800" 
          : "bg-yellow-100 text-yellow-800"
      }`}>
        <span className="text-xl font-bold">
          {currentPlayerAnswered ? "✓" : "..."}
        </span>
        <span className="text-sm font-semibold">
          {currentPlayerAnswered ? "You answered" : "Waiting for your answer"}
        </span>
      </div>
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 justify-center ${
        opponentAnswered 
          ? "bg-green-100 text-green-800" 
          : "bg-yellow-100 text-yellow-800"
      }`}>
        <span className="text-xl font-bold">
          {opponentAnswered ? "✓" : "..."}
        </span>
        <span className="text-sm font-semibold">
          {opponentAnswered ? "Opponent answered" : "Opponent thinking..."}
        </span>
      </div>
    </div>
  );
};

export default PlayerStatus;

