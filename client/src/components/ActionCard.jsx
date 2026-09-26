import { useState } from "react";
import { Clock, Copy, Check } from "lucide-react";

const ActionCard = ({ nextAction, priorities }) => {
  const [copied, setCopied] = useState(false);

  if (!nextAction) return null;
  const matchedPriority = priorities?.find((p) => p.issue_id === nextAction.issue_id);
  const minutes = matchedPriority?.estimated_minutes || 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(nextAction.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-green-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-green-200">
          Recommended Next Action
        </span>
        <span className="text-xs bg-green-700 text-white px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>~{minutes} mins</span>
        </span>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
        {nextAction.text}
      </h3>

      <div className="mt-3 pt-3 border-t border-green-700 text-xs sm:text-sm text-green-100 leading-relaxed">
        <span className="font-semibold text-white mr-1.5">Why this matters:</span>
        {nextAction.why}
      </div>

      <div className="mt-3 pt-1 flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white transition flex items-center gap-1.5 font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Action Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ActionCard;
