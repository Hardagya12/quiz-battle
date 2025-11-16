import "./ScoreBoard.css";

const ScoreBoard = ({ scores, player1, player2, currentUserId }) => {
  const isPlayer1 =
    player1?._id?.toString() === currentUserId || player1?.toString() === currentUserId;

  return (
    <div className="scoreboard">
      <div className={`score-item ${isPlayer1 ? "current-player" : ""}`}>
        <div className="player-info">
          <span className="player-name">
            {player1?.username || "Player 1"}
            {isPlayer1 && <span className="badge">You</span>}
          </span>
        </div>
        <div className="score-value">{scores?.player1 || 0}</div>
      </div>

      <div className="score-divider">VS</div>

      <div className={`score-item ${!isPlayer1 ? "current-player" : ""}`}>
        <div className="player-info">
          <span className="player-name">
            {player2?.username || "Player 2"}
            {!isPlayer1 && <span className="badge">You</span>}
          </span>
        </div>
        <div className="score-value">{scores?.player2 || 0}</div>
      </div>
    </div>
  );
};

export default ScoreBoard;

