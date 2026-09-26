import { useState } from "react";
import { RefreshCw, ArrowRight } from "lucide-react";

const UpdateSection = ({ version, changes = [], onUpdate, loading }) => {
  const [updateText, setUpdateText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    onUpdate(updateText);
    setUpdateText("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Situation History & Updates
          </span>
          <span className="text-xs font-mono font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
            Version {version}
          </span>
        </div>

        {changes.length > 0 && (
          <span className="text-xs text-green-800 font-semibold">
            {changes.length} change{changes.length > 1 ? "s" : ""} recorded in this version
          </span>
        )}
      </div>

      {changes.length > 0 && (
        <div className="mb-4 space-y-2">
          {changes.map((c, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-gray-50 border border-green-200 text-xs text-gray-900 flex items-start gap-2.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-green-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-green-800 font-semibold">{c.field}</span>:
                {c.from && <span className="line-through text-gray-400 mx-1">{c.from}</span>}
                <span className="text-green-800 font-bold mx-1 flex-inline items-center">
                  <ArrowRight className="w-3 h-3 inline mx-0.5" /> {c.to}
                </span>
                <p className="text-gray-600 text-xs mt-0.5">{c.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Did something change or did you take an action? Update your situation:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. Actually professor said Thursday, or I called my friend and borrowed a laptop..."
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            disabled={loading}
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-800"
          />
          <button
            type="submit"
            disabled={loading || !updateText.trim()}
            className="px-5 py-2.5 rounded-full bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition shrink-0 shadow-sm cursor-pointer"
          >
            {loading ? "Updating..." : "Update Plan (v" + (version + 1) + ")"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateSection;
