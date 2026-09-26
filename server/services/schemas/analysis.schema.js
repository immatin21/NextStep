import { z } from "zod";

export const ModeEnum = z.enum([
  "standard",
  "support",
  "out_of_scope",
  "needs_clarification",
]);

export const CategoryEnum = z.enum([
  "work_study",
  "money",
  "family",
  "health",
  "housing",
  "relationships",
  "travel",
  "other",
]);

export const ConfidenceLevelEnum = z.enum(["low", "medium", "high"]);

export const IssueSchema = z.object({
  id: z.string().regex(/^iss_[0-9]+$/, {
    message: "Issue id must match pattern ^iss_[0-9]+$",
  }),
  title: z.string().min(1),
  category: CategoryEnum,
  urgency: z.number().int().min(1).max(5),
  deadline: z.string().datetime({ offset: true }).nullable(),
  depends_on: z.array(z.string().regex(/^iss_[0-9]+$/)),
});

export const PrioritySchema = z.object({
  rank: z.number().int().min(1),
  issue_id: z.string().regex(/^iss_[0-9]+$/),
  action: z.string().min(1),
  reason: z.string().min(1),
  estimated_minutes: z.number().int().min(1),
});

export const NextActionSchema = z.object({
  text: z.string().min(1),
  issue_id: z.string().regex(/^iss_[0-9]+$/),
  why: z.string().min(1),
});

export const ClarifyingQuestionSchema = z.object({
  id: z.string().regex(/^q_[0-9]+$/),
  question: z.string().min(1),
  options: z.array(z.string().min(1)),
  skippable: z.boolean(),
});

export const ConfidenceSchema = z.object({
  level: ConfidenceLevelEnum,
  reasons: z.array(z.string()),
});

export const ChangeSchema = z.object({
  field: z.string().min(1),
  from: z.string().nullable(),
  to: z.string().nullable(),
  reason: z.string().min(1),
});

export const SupportResourceSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  hours: z.string().min(1),
});

export const SupportSchema = z.object({
  message: z.string().min(1),
  resources: z.array(SupportResourceSchema).min(1),
  offer_to_continue: z.string().min(1),
});

export const AnalysisResponseSchema = z
  .object({
    situation_id: z.string().regex(/^sit_[a-z0-9]{6}$/, {
      message: "situation_id must match pattern ^sit_[a-z0-9]{6}$",
    }),
    version: z.number().int().min(1),
    server_time: z.string().datetime({ offset: true }),
    mode: ModeEnum,
    summary: z.string().min(1),
    issues: z.array(IssueSchema),
    priorities: z.array(PrioritySchema),
    next_action: NextActionSchema.nullable(),
    clarifying_questions: z.array(ClarifyingQuestionSchema),
    missing_information: z.array(z.string()),
    risk_flags: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)),
    confidence: ConfidenceSchema,
    changes: z.array(ChangeSchema),
    support: SupportSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "support") {
      if (data.issues.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "issues must be empty when mode is support",
          path: ["issues"],
        });
      }
      if (data.priorities.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "priorities must be empty when mode is support",
          path: ["priorities"],
        });
      }
      if (data.next_action !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "next_action must be null when mode is support",
          path: ["next_action"],
        });
      }
      if (!data.support) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "support object is required when mode is support",
          path: ["support"],
        });
      }
    } else {
      if (data.support !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "support must be null when mode is not support",
          path: ["support"],
        });
      }
    }

    if (data.mode === "standard" && data.issues.length > 0 && !data.next_action) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "standard mode with at least one issue must recommend next_action",
        path: ["next_action"],
      });
    }

    if (data.mode === "needs_clarification" && data.clarifying_questions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "needs_clarification mode must ask at least one question",
        path: ["clarifying_questions"],
      });
    }

    if (data.version === 1 && data.changes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "changes must be empty for version 1",
        path: ["changes"],
      });
    }
  });
