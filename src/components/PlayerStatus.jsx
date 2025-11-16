import "./PlayerStatus.css";

const PlayerStatus = ({ player1Answered, player2Answered, isPlayer1 }) => {
  const currentPlayerAnswered = isPlayer1 ? player1Answered : player2Answered;
  const opponentAnswered = isPlayer1 ? player2Answered : player1Answered;

  return (
    <div className="player-status">
      <div className={`status-item ${currentPlayerAnswered ? "answered" : "waiting"}`}>
        <span className="status-icon">
          {currentPlayerAnswered ? "✓" : "..."}
        </span>
        <span className="status-text">
          {currentPlayerAnswered ? "You answered" : "Waiting for your answer"}
        </span>
      </div>
      <div className={`status-item ${opponentAnswered ? "answered" : "waiting"}`}>
        <span className="status-icon">
          {opponentAnswered ? "✓" : "..."}
        </span>
        <span className="status-text">
          {opponentAnswered ? "Opponent answered" : "Opponent thinking..."}
        </span>
      </div>
    </div>
  );
};

export default PlayerStatus;

