import { useState } from "react";
import { HelpCircle } from "lucide-react";

const ClarificationCard = ({ questions = [], onAnswer, loading }) => {
  const [answers, setAnswers] = useState({});

  if (!questions || questions.length === 0) return null;

  const handleSelectOption = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleTextChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] || null,
    }));
    onAnswer(formatted);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-4 h-4 text-green-800 shrink-0" />
        <h4 className="text-sm sm:text-base font-bold text-gray-900">
          A few quick details will sharpen this plan:
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2.5">
              {q.question}
            </p>

            {q.options && q.options.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {q.options.map((opt, i) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-green-800 text-white font-bold"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <input
              type="text"
              placeholder="Or type custom answer..."
              value={answers[q.id] || ""}
              onChange={(e) => handleTextChange(q.id, e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-800"
            />
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            {loading ? "Reassessing..." : "Update Plan with Answers"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClarificationCard;
