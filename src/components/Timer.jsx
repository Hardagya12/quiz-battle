import { useEffect, useState } from "react";

const Timer = ({ timeRemaining }) => {
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    setIsLow(timeRemaining <= 5);
  }, [timeRemaining]);

  const percentage = (timeRemaining / 20) * 100;

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24 md:w-20 md:h-20">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isLow ? "#ef4444" : "#10b981"}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl md:text-2xl font-bold ${isLow ? "text-red-500 animate-pulse" : "text-gray-800"}`}>
            {timeRemaining}
          </span>
          <span className="text-sm text-gray-500">s</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;

