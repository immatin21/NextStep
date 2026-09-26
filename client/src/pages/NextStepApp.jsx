import { useState } from "react";
import { Compass, Trash2, Plus, Check, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import ScenarioButtons from "../components/ScenarioButtons";
import Loader from "../components/Loader";
import CalmSupport from "../components/CalmSupport";
import ActionCard from "../components/ActionCard";
import PriorityList from "../components/PriorityList";
import ClarificationCard from "../components/ClarificationCard";
import UpdateSection from "../components/UpdateSection";
import RiskAlerts from "../components/RiskAlerts";
import {
  createSituation,
  updateSituation,
  answerQuestions,
  purgeSituation,
} from "../services/situationApi";

const NextStepApp = () => {
  const [inputText, setInputText] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const handleSelectScenario = (sc) => {
    setActiveScenarioId(sc.id);
    setInputText(sc.text);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setPurgeSuccess(false);

    try {
      const result = await createSituation({
        text: inputText,
      });
      setAnalysis(result);
    } catch (err) {
      console.error("API error:", err);
      setError(
        err.response?.data?.error ||
          "Could not analyze situation. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updateText) => {
    if (!analysis?.situation_id) return;
    setLoading(true);
    setError(null);

    try {
      const result = await updateSituation(analysis.situation_id, updateText);
      setAnalysis(result);
    } catch (err) {
      console.error("Update error:", err);
      setError("Unable to record update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestions = async (answers) => {
    if (!analysis?.situation_id) return;
    setLoading(true);
    setError(null);

    try {
      const result = await answerQuestions(analysis.situation_id, answers);
      setAnalysis(result);
    } catch (err) {
      console.error("Answers error:", err);
      setError("Unable to submit answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!analysis?.situation_id) return;
    const confirm = window.confirm(
      "Are you sure you want to permanently delete this situation and all its history?",
    );
    if (!confirm) return;

    try {
      await purgeSituation(analysis.situation_id);
      setAnalysis(null);
      setInputText("");
      setActiveScenarioId(null);
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 4000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete situation data.");
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setInputText("");
    setActiveScenarioId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-200 to-gray-500 text-gray-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
        <ScenarioButtons
          onSelectScenario={handleSelectScenario}
          activeScenarioId={activeScenarioId}
        />

        {!analysis && (
          <div className="bg-white/50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Describe your situation
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Paste your messy situation—overlapping deadlines, broken tools,
                Hinglish notes, or personal constraints.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Viva is at 10am tomorrow, laptop won't boot, and my dad just got admitted to hospital..."
                className="w-full bg-gray-50 text-gray-900 rounded-xl p-4 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-800/30 border border-gray-300 transition resize-y"
              />

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? "Analyzing..." : "Analyze Situation"}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {purgeSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-green-700 shrink-0" />
            <span>
              Situation and its history have been permanently deleted.
            </span>
          </div>
        )}

        {loading && <Loader />}

        {analysis && !loading && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-500">
                  ID: {analysis.situation_id}
                </span>
                <span className="font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  Version {analysis.version}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-green-800 hover:underline font-medium cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Situation</span>
              </button>
            </div>

            {analysis.mode === "support" && (
              <CalmSupport
                support={analysis.support}
                situationId={analysis.situation_id}
                onReset={handleReset}
              />
            )}

            {analysis.mode === "out_of_scope" && (
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 text-center shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-800">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  Request Out of Scope
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  {analysis.summary}
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-green-800 text-white text-sm font-medium hover:bg-green-700 cursor-pointer"
                >
                  Try another situation
                </button>
              </div>
            )}

            {(analysis.mode === "standard" ||
              analysis.mode === "needs_clarification") && (
              <>
                <RiskAlerts
                  riskFlags={analysis.risk_flags}
                  confidence={analysis.confidence}
                />

                <ActionCard
                  nextAction={analysis.next_action}
                  priorities={analysis.priorities}
                />

                <PriorityList
                  priorities={analysis.priorities}
                  issues={analysis.issues}
                />

                {analysis.clarifying_questions?.length > 0 && (
                  <ClarificationCard
                    questions={analysis.clarifying_questions}
                    onAnswer={handleAnswerQuestions}
                    loading={loading}
                  />
                )}

                <UpdateSection
                  version={analysis.version}
                  changes={analysis.changes}
                  onUpdate={handleUpdate}
                  loading={loading}
                />
              </>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleDelete}
                className="text-xs text-red-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete this situation</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NextStepApp;
