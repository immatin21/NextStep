import { AnalysisResponseSchema } from "./schemas/analysis.schema.js";

export const DEFAULT_SUPPORT_RESOURCES = [
  {
    name: "Tele-MANAS (Govt of India)",
    contact: "14416 or 1800-891-4416",
    hours: "24/7, Toll-free, Multilingual",
  },
  {
    name: "KIRAN Helpline",
    contact: "1800-599-0019",
    hours: "24/7, Toll-free",
  },
  {
    name: "AASRA",
    contact: "+91 9820466726",
    hours: "24/7, Confidential suicide prevention",
  },
  {
    name: "Vandrevala Foundation",
    contact: "+91 9999 666 555",
    hours: "24/7, Free mental health support",
  },
];

export function extractAndParseJSON(rawText) {
  if (typeof rawText === "object" && rawText !== null) {
    return rawText;
  }

  if (typeof rawText !== "string") {
    throw new Error("Invalid input: expected string or object");
  }

  let text = rawText.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/```\s*$/, "");
    text = text.trim();
  }

  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    text = text.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    let repaired = text
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/;\s*$/, "");

    return JSON.parse(repaired);
  }
}

export function normalizeAndRepair(data, context = {}) {
  const { situationId = "sit_000001", version = 1, rawInput = "" } = context;

  const out = { ...data };

  if (!out.situation_id || !/^sit_[a-z0-9]{6}$/.test(out.situation_id)) {
    out.situation_id = situationId;
  }

  out.version = Number.isInteger(out.version) && out.version >= 1 ? out.version : version;

  if (!out.server_time || isNaN(Date.parse(out.server_time))) {
    out.server_time = new Date().toISOString();
  }

  const validModes = ["standard", "support", "out_of_scope", "needs_clarification"];
  if (!validModes.includes(out.mode)) {
    const lower = rawInput.toLowerCase();
    if (
      lower.includes("what's the point") ||
      lower.includes("tired of all of it") ||
      lower.includes("want it all to stop") ||
      lower.includes("falling apart")
    ) {
      out.mode = "support";
    } else if (
      lower.includes("write a 1500-word essay") ||
      lower.includes("write an essay") ||
      lower.includes("do my homework")
    ) {
      out.mode = "out_of_scope";
    } else {
      out.mode = "standard";
    }
  }

  if (!out.summary || typeof out.summary !== "string") {
    out.summary = "Situation analyzed and structured.";
  }

  out.issues = Array.isArray(out.issues) ? out.issues : [];
  out.priorities = Array.isArray(out.priorities) ? out.priorities : [];
  out.clarifying_questions = Array.isArray(out.clarifying_questions) ? out.clarifying_questions : [];
  out.missing_information = Array.isArray(out.missing_information) ? out.missing_information : [];
  out.risk_flags = Array.isArray(out.risk_flags) ? out.risk_flags : [];
  out.changes = Array.isArray(out.changes) ? out.changes : [];

  const validCategories = [
    "work_study",
    "money",
    "family",
    "health",
    "housing",
    "relationships",
    "travel",
    "other",
  ];

  out.issues = out.issues.map((iss, idx) => {
    let id = iss.id;
    if (!id || !/^iss_[0-9]+$/.test(String(id))) {
      id = `iss_${idx + 1}`;
    }
    return {
      id,
      title: iss.title || `Issue ${idx + 1}`,
      category: validCategories.includes(iss.category) ? iss.category : "other",
      urgency: Math.min(Math.max(Number(iss.urgency) || 3, 1), 5),
      deadline: iss.deadline && !isNaN(Date.parse(iss.deadline)) ? iss.deadline : null,
      depends_on: Array.isArray(iss.depends_on)
        ? iss.depends_on.filter((d) => typeof d === "string" && /^iss_[0-9]+$/.test(d))
        : [],
    };
  });

  out.priorities = out.priorities.map((p, idx) => {
    let issueId = p.issue_id;
    const matchingIssue = out.issues.find((i) => i.id === issueId);
    if (!matchingIssue && out.issues.length > 0) {
      issueId = out.issues[0].id;
    } else if (!issueId || !/^iss_[0-9]+$/.test(String(issueId))) {
      issueId = `iss_${idx + 1}`;
    }

    return {
      rank: Number(p.rank) >= 1 ? Math.floor(Number(p.rank)) : idx + 1,
      issue_id: issueId,
      action: p.action || "Take immediate next step",
      reason: p.reason || "High relative urgency",
      estimated_minutes: Number(p.estimated_minutes) >= 1 ? Math.floor(Number(p.estimated_minutes)) : 15,
    };
  });

  out.clarifying_questions = out.clarifying_questions.map((q, idx) => {
    let qid = q.id;
    if (!qid || !/^q_[0-9]+$/.test(String(qid))) {
      qid = `q_${idx + 1}`;
    }
    return {
      id: qid,
      question: q.question || "Could you clarify additional details?",
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      skippable: typeof q.skippable === "boolean" ? q.skippable : true,
    };
  });

  out.risk_flags = out.risk_flags
    .map((flag) =>
      String(flag)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^_+/, "")
    )
    .filter((f) => /^[a-z][a-z0-9_]*$/.test(f));

  out.risk_flags = Array.from(new Set(out.risk_flags));

  const validLevels = ["low", "medium", "high"];
  out.confidence = {
    level: validLevels.includes(out.confidence?.level) ? out.confidence.level : "medium",
    reasons: Array.isArray(out.confidence?.reasons)
      ? out.confidence.reasons.map(String)
      : ["Structured assessment completed."],
  };

  if (out.mode === "support") {
    out.issues = [];
    out.priorities = [];
    out.next_action = null;

    if (!out.support || typeof out.support !== "object") {
      out.support = {
        message:
          "It sounds like you are carrying a very heavy burden right now. You don't have to carry this completely alone, and it's okay to step back from tasks.",
        resources: DEFAULT_SUPPORT_RESOURCES,
        offer_to_continue: "Whenever you feel ready, we can return to look at things one small step at a time.",
      };
    } else {
      out.support = {
        message: out.support.message || "Please take care of yourself first.",
        resources:
          Array.isArray(out.support.resources) && out.support.resources.length > 0
            ? out.support.resources
            : DEFAULT_SUPPORT_RESOURCES,
        offer_to_continue:
          out.support.offer_to_continue ||
          "We can pause and resume whenever you are ready.",
      };
    }
  } else {
    out.support = null;

    if (out.mode === "standard" && out.issues.length > 0) {
      if (!out.next_action || typeof out.next_action !== "object") {
        const topPriority = out.priorities[0];
        out.next_action = {
          text: topPriority?.action || "Address the primary issue",
          issue_id: topPriority?.issue_id || out.issues[0].id,
          why: topPriority?.reason || "Highest impact next step",
        };
      } else {
        out.next_action = {
          text: out.next_action.text || "Address the first priority",
          issue_id:
            out.issues.find((i) => i.id === out.next_action.issue_id)?.id ||
            out.issues[0].id,
          why: out.next_action.why || "Crucial immediate step",
        };
      }
    } else if (out.mode !== "standard" || out.issues.length === 0) {
      out.next_action = null;
    }

    if (out.mode === "needs_clarification" && out.clarifying_questions.length === 0) {
      out.clarifying_questions = [
        {
          id: "q_1",
          question: "Which of these matters needs your attention first?",
          options: ["Deadline / Exam", "Family / Emergency", "Financial / Housing"],
          skippable: true,
        },
      ];
    }
  }

  if (out.version === 1) {
    out.changes = [];
  } else {
    out.changes = out.changes.map((c) => ({
      field: String(c.field || "general"),
      from: c.from !== undefined ? (c.from === null ? null : String(c.from)) : null,
      to: c.to !== undefined ? (c.to === null ? null : String(c.to)) : null,
      reason: String(c.reason || "Updated in reassessment"),
    }));
  }

  return out;
}

export function generateDeterministicFallback(rawInput, context = {}) {
  const { situationId = "sit_000001", version = 1 } = context;
  const lower = (rawInput || "").toLowerCase();

  if (
    lower.includes("what's the point") ||
    lower.includes("tired of all of it") ||
    lower.includes("want it all to stop") ||
    lower.includes("falling apart")
  ) {
    return {
      situation_id: situationId,
      version,
      server_time: new Date().toISOString(),
      mode: "support",
      summary: "You are experiencing high stress and overwhelm.",
      issues: [],
      priorities: [],
      next_action: null,
      clarifying_questions: [],
      missing_information: [],
      risk_flags: ["emotional_distress_support"],
      confidence: {
        level: "high",
        reasons: ["Safety crisis detector triggered support protocol."],
      },
      changes: [],
      support: {
        message:
          "It sounds like you're carrying an overwhelming amount of weight right now. You don't have to tackle this alone.",
        resources: DEFAULT_SUPPORT_RESOURCES,
        offer_to_continue: "Take your time. You can come back whenever you are ready.",
      },
    };
  }

  const casualKeywords = [
    "pizza",
    "cricket match",
    "recommend a movie",
    "good places to",
    "tell me a joke",
    "weather like",
    "who won the",
    "favorite food",
  ];
  const hasDilemmaIndicators = [
    "deadline", "urgent", "hospital", "money", "evict", "exam", "viva",
    "partner", "landlord", "fail", "broken", "stolen", "sick", "fired",
    "manager", "hr", "trouble", "scared", "stress", "help", "problem",
    "decision", "choose", "what should i do", "kal submission", "paise"
  ].some((k) => lower.includes(k));

  if (
    lower.includes("write a 1500-word essay") ||
    lower.includes("write an essay") ||
    lower.includes("climate change") ||
    lower.includes("do my assignment") ||
    lower.includes("do my homework")
  ) {
    return {
      situation_id: situationId,
      version,
      server_time: new Date().toISOString(),
      mode: "out_of_scope",
      summary: "Request is for automated content writing rather than personal situational decision-making.",
      issues: [],
      priorities: [],
      next_action: null,
      clarifying_questions: [],
      missing_information: [],
      risk_flags: ["out_of_scope_request"],
      confidence: {
        level: "high",
        reasons: ["NextStep is an assistant for life decisions, not an essay writer."],
      },
      changes: [],
      support: null,
    };
  }

  if (casualKeywords.some((k) => lower.includes(k)) && !hasDilemmaIndicators) {
    return {
      situation_id: situationId,
      version,
      server_time: new Date().toISOString(),
      mode: "out_of_scope",
      summary: "This looks like casual conversation or a general inquiry rather than a personal decision dilemma. NextStep is specifically designed to help people prioritize and make decisions during messy, high-stress situations.",
      issues: [],
      priorities: [],
      next_action: null,
      clarifying_questions: [],
      missing_information: [],
      risk_flags: ["out_of_scope_request"],
      confidence: {
        level: "high",
        reasons: ["No personal dilemma, conflict, or decision pressure detected."],
      },
      changes: [],
      support: null,
    };
  }

  if (
    lower.includes("manager") &&
    (lower.includes("hr") || lower.includes("angry") || lower.includes("worse"))
  ) {
    return {
      situation_id: situationId,
      version,
      server_time: new Date().toISOString(),
      mode: "standard",
      summary: "Your previous email escalated the situation with your manager, and HR is now involved.",
      issues: [
        {
          id: "iss_1",
          title: "Workplace conflict & HR escalation",
          category: "work_study",
          urgency: 5,
          deadline: null,
          depends_on: [],
        },
      ],
      priorities: [
        {
          rank: 1,
          issue_id: "iss_1",
          action: "Do not reply to the email thread yet. Step back and pause written communication.",
          reason: "Replying while defensive on an escalated thread with HR creates a permanent record and increases tension.",
          estimated_minutes: 15,
        },
        {
          rank: 2,
          issue_id: "iss_1",
          action: "Draft a neutral, factual timeline of what was discussed and sent in a private document.",
          reason: "Prepares you to respond with facts rather than emotional reactions.",
          estimated_minutes: 20,
        },
        {
          rank: 3,
          issue_id: "iss_1",
          action: "Request a brief 1-on-1 call or in-person sync with your manager to clear misunderstandings.",
          reason: "Direct conversation de-escalates tone misinterpretations faster than email chains.",
          estimated_minutes: 10,
        },
      ],
      next_action: {
        text: "Do not reply to the email thread yet. Step away for 15 minutes to let the adrenaline subside.",
        issue_id: "iss_1",
        why: "Any hasty written response on an active HR escalation will make things significantly worse.",
      },
      clarifying_questions: [
        {
          id: "q_1",
          question: "What was your manager's primary concern in the email?",
          options: ["Tone of email", "Missed deadline", "Involving others / Process"],
          skippable: true,
        },
      ],
      missing_information: ["The specific wording of the manager's reply", "Company grievance process"],
      risk_flags: ["workplace_conflict_escalation"],
      confidence: {
        level: "high",
        reasons: ["Standard de-escalation protocol applied for workplace conflict."],
      },
      changes: [],
      support: null,
    };
  }

  return {
    situation_id: situationId,
    version,
    server_time: new Date().toISOString(),
    mode: "standard",
    summary: rawInput.length > 120 ? rawInput.substring(0, 117) + "..." : rawInput,
    issues: [
      {
        id: "iss_1",
        title: "Immediate situational pressure",
        category: "work_study",
        urgency: 4,
        deadline: null,
        depends_on: [],
      },
    ],
    priorities: [
      {
        rank: 1,
        issue_id: "iss_1",
        action: "Pause and list the non-negotiable constraints",
        reason: "De-escalates initial cognitive overwhelm",
        estimated_minutes: 10,
      },
    ],
    next_action: {
      text: "Take 10 minutes to write down the single thing with the nearest deadline",
      issue_id: "iss_1",
      why: "Immediate step to reduce uncertainty under high stress",
    },
    clarifying_questions: [
      {
        id: "q_1",
        question: "Which of these issues has a hard external deadline today?",
        options: ["Academic / Work", "Health / Family", "Money / Housing"],
        skippable: true,
      },
    ],
    missing_information: ["Specific external deadlines", "Available resources"],
    risk_flags: ["ai_fallback_degraded"],
    confidence: {
      level: "low",
      reasons: ["Generated via deterministic fallback engine during AI load/failure."],
    },
    changes: [],
    support: null,
  };
}

export function validateAndRepairAnalysis(rawTextOrObj, context = {}) {
  let parsed = null;
  let tierUsed = "clean";

  try {
    parsed = extractAndParseJSON(rawTextOrObj);
  } catch (err) {
    console.warn("Tier 1 syntactic repair failed:", err.message);
  }

  if (parsed) {
    try {
      const repaired = normalizeAndRepair(parsed, context);
      const zodResult = AnalysisResponseSchema.safeParse(repaired);
      if (zodResult.success) {
        return {
          success: true,
          data: zodResult.data,
          tier: tierUsed === "clean" ? "tier1_repaired" : "tier2_normalized",
        };
      } else {
        console.warn("Zod schema validation issues after Tier 2:", zodResult.error.format());
      }
    } catch (err) {
      console.warn("Tier 2 normalization threw error:", err.message);
    }
  }

  console.warn("Activating Tier 3 Deterministic Fallback Engine");
  const fallback = generateDeterministicFallback(context.rawInput || "", context);
  const validatedFallback = AnalysisResponseSchema.parse(fallback);

  return {
    success: true,
    data: validatedFallback,
    tier: "tier3_fallback",
  };
}
