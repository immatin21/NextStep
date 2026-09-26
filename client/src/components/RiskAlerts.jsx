import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  HeartPulse,
  Clock,
  Home,
  Briefcase,
  Calendar,
  Info,
  HelpCircle,
} from "lucide-react";

const RISK_BADGE_MAP = {
  prompt_injection_detected: {
    label: "Prompt injection ignored",
    icon: ShieldCheck,
    color: "bg-green-100 border-green-300 text-green-900",
  },
  financial_scam_warning: {
    label: "Never share UPI PIN or bank details",
    icon: AlertTriangle,
    color: "bg-red-100 border-red-300 text-red-900",
  },
  tied_priorities: {
    label: "Equal priority items found",
    icon: Scale,
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  family_medical_emergency: {
    label: "Family emergency prioritized",
    icon: HeartPulse,
    color: "bg-red-100 border-red-300 text-red-900",
  },
  imminent_academic_deadline: {
    label: "Academic deadline approaching",
    icon: Clock,
    color: "bg-green-50 border-green-300 text-green-900",
  },
  imminent_eviction_risk: {
    label: "Housing deadline noted",
    icon: Home,
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  workplace_conflict_escalation: {
    label: "Workplace issue noted",
    icon: Briefcase,
    color: "bg-gray-100 border-gray-300 text-gray-800",
  },
  contradictory_user_timeline: {
    label: "Earlier deadline used to stay safe",
    icon: Calendar,
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  ai_fallback_degraded: {
    label: "Backup response mode",
    icon: Info,
    color: "bg-gray-200 border-gray-300 text-gray-800",
  },
  out_of_scope_request: {
    label: "Outside decision support scope",
    icon: HelpCircle,
    color: "bg-gray-100 border-gray-300 text-gray-800",
  },
};

const RiskAlerts = ({ riskFlags = [], confidence }) => {
  if ((!riskFlags || riskFlags.length === 0) && !confidence) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {confidence && (
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300">
          Confidence: {confidence.level.toUpperCase()}
        </span>
      )}

      {riskFlags.map((flag, idx) => {
        const mapped = RISK_BADGE_MAP[flag] || {
          label: flag.replace(/_/g, " "),
          icon: Info,
          color: "bg-gray-100 border-gray-300 text-gray-800",
        };
        const IconComponent = mapped.icon || Info;

        return (
          <span
            key={idx}
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${mapped.color}`}
          >
            <IconComponent className="w-3.5 h-3.5 shrink-0" />
            <span>{mapped.label}</span>
          </span>
        );
      })}
    </div>
  );
};

export default RiskAlerts;
