import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const Loader = () => {
  const [seconds, setSeconds] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let phaseMessage = "Reading and parsing your situation...";
  let subMessage = "Understanding your situation • Keeping your data private";

  if (seconds >= 4 && seconds < 9) {
    phaseMessage = "Untangling conflicting deadlines & problems...";
    subMessage = "Sorting out deadlines, urgent tasks, and key constraints";
  } else if (seconds >= 9) {
    phaseMessage = "Finding the best first step to take...";
    subMessage = "Putting together a clear, manageable plan";
  }

  return (
    <div className="my-8 p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-800 mb-3 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-green-800" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-gray-900 transition-all duration-300">
        {phaseMessage}
      </h3>
      <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">{subMessage}</p>

      <div className="mt-5 max-w-xs mx-auto flex items-center gap-2.5">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
          <div
            className="bg-green-800 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(seconds * 8, 95)}%` }}
          ></div>
        </div>
        <span className="text-xs font-mono text-green-800 font-bold">{seconds}s</span>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Working on your situation • Please hold on a moment
      </p>
    </div>
  );
};

export default Loader;
