import { useEffect, useState } from "react";
import "./Timer.css";

const Timer = ({ timeRemaining }) => {
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    setIsLow(timeRemaining <= 5);
  }, [timeRemaining]);

  const percentage = (timeRemaining / 20) * 100;

  return (
    <div className="timer-container">
      <div className={`timer-circle ${isLow ? "low-time" : ""}`}>
        <svg className="timer-svg" viewBox="0 0 100 100">
          <circle
            className="timer-background"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isLow ? "#ff4444" : "#4caf50"}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="timer-text">
          <span className="timer-number">{timeRemaining}</span>
          <span className="timer-label">s</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;

