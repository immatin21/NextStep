import { useState } from "react";
import { Clock, ListOrdered, Layers } from "lucide-react";

const CATEGORY_NAMES = {
  work_study: "Study & Work",
  money: "Money",
  family: "Family",
  health: "Health",
  housing: "Housing",
  relationships: "Relationships",
  travel: "Travel",
  other: "General",
};

const PriorityList = ({ priorities = [], issues = [] }) => {
  const [tab, setTab] = useState("priorities");

  const rankCounts = priorities.reduce((acc, p) => {
    acc[p.rank] = (acc[p.rank] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("priorities")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              tab === "priorities"
                ? "bg-green-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Action Priorities ({priorities.length})</span>
          </button>
          <button
            onClick={() => setTab("issues")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              tab === "issues"
                ? "bg-green-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Identified Issues ({issues.length})</span>
          </button>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          {tab === "priorities" ? "Ranked by urgency" : "Breakdown of problems"}
        </span>
      </div>

      {tab === "priorities" && (
        <div className="space-y-2.5">
          {priorities.map((item, idx) => {
            const isTied = rankCounts[item.rank] > 1;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-green-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                      {isTied && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Equal Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>~{item.estimated_minutes}m</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-2.5">
          {issues.map((iss) => (
            <div
              key={iss.id}
              className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{iss.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                  <span>Category: {CATEGORY_NAMES[iss.category] || iss.category}</span>
                  {iss.deadline && (
                    <span>• Deadline: {new Date(iss.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                  iss.urgency >= 5
                    ? "bg-red-100 text-red-800"
                    : iss.urgency >= 4
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                Urgency {iss.urgency}/5
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriorityList;
