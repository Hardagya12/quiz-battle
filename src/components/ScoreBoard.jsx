const ScoreBoard = ({ scores, player1, player2, currentUserId }) => {
  const isPlayer1 =
    player1?._id?.toString() === currentUserId || player1?.toString() === currentUserId;

  return (
    <div className="bg-white p-6 rounded-xl mb-4 flex items-center justify-around shadow-lg flex-col md:flex-row gap-4">
      <div className={`flex-1 text-center p-4 rounded-lg transition-all ${
        isPlayer1 ? "bg-indigo-50 border-2 border-indigo-500" : "bg-gray-50"
      }`}>
        <div className="mb-2">
          <span className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
            {player1?.username || "Player 1"}
            {isPlayer1 && <span className="badge">You</span>}
          </span>
        </div>
        <div className="text-3xl font-bold text-indigo-500">{scores?.player1 || 0}</div>
      </div>

      <div className="text-2xl font-bold text-gray-500 px-4">VS</div>

      <div className={`flex-1 text-center p-4 rounded-lg transition-all ${
        !isPlayer1 ? "bg-indigo-50 border-2 border-indigo-500" : "bg-gray-50"
      }`}>
        <div className="mb-2">
          <span className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
            {player2?.username || "Player 2"}
            {!isPlayer1 && <span className="badge">You</span>}
          </span>
        </div>
        <div className="text-3xl font-bold text-indigo-500">{scores?.player2 || 0}</div>
      </div>
    </div>
  );
};

export default ScoreBoard;

