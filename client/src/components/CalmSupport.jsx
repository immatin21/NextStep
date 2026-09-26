import { Phone, Heart } from "lucide-react";

const CalmSupport = ({ support, onReset }) => {
  if (!support) return null;

  return (
    <div className="my-6 p-6 sm:p-8 rounded-3xl bg-white border border-green-200 shadow-sm text-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-green-800" />
        <span className="text-xs font-bold uppercase tracking-wider text-green-800">
          Support & Care Mode
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
        Let's pause right here. You don't have to carry this alone.
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        There are no tasks or strict deadlines here. Your well-being comes first.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-sm text-green-900 font-medium leading-relaxed">
        {support.message}
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Free, Confidential Crisis Support Available 24/7 in India:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {support.resources?.map((res, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-green-800 transition-all flex flex-col justify-between gap-2"
            >
              <div>
                <div className="font-bold text-gray-900 text-sm">{res.name}</div>
                <div className="text-xs text-gray-500">{res.hours}</div>
              </div>
              <a
                href={`tel:${res.contact.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-green-800 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition w-fit"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {res.contact}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs text-gray-600">
          {support.offer_to_continue || "Take all the time you need. We will be right here whenever you want to return."}
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-full bg-green-800 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition shrink-0 cursor-pointer"
        >
          Start new situation
        </button>
      </div>
    </div>
  );
};

export default CalmSupport;
