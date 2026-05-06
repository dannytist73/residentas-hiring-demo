import { z } from "zod";

export const ApplicationFormSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  gender: z.string().min(1),
  location: z.string().min(1).max(120),
  jobTenure: z.string().min(1).max(60),
  pastExperience: z.string().min(1).max(2000),
  crossBorderFinanceExperience: z.string().min(1).max(2000),
  toolsUsed: z.string().min(1).max(500),
  aiUsageExample: z.string().min(1).max(2000),
  q1Answer: z.string().min(1).max(5000),
  q2Answer: z.string().min(1).max(5000),
  currentlyEmployed: z.string().min(1),
  expectedPay: z.coerce.number().nonnegative(),
  hoursPerWeek: z.coerce.number().int().min(1).max(80),
  additionalComments: z.string().max(2000).default(""),
});

export type ApplicationFormInput = z.infer<typeof ApplicationFormSchema>;

export const Outcome = z.enum(["Advance", "Review", "Reject"]);
export type Outcome = z.infer<typeof Outcome>;

export const Status = z.enum(["Pending Scoring", "Pending Review", "Sent", "Failed"]);
export type Status = z.infer<typeof Status>;

export const CandidateRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  submittedAt: z.string(),

  pastExperience: z.string().default(""),
  toolsUsed: z.string().default(""),
  q1Answer: z.string().default(""),
  q2Answer: z.string().default(""),

  processThinking: z.number().min(0).max(5).optional(),
  practicalAutomation: z.number().min(0).max(5).optional(),
  clarityCommunication: z.number().min(0).max(5).optional(),
  executionLogic: z.number().min(0).max(5).optional(),
  reliabilityAwareness: z.number().min(0).max(5).optional(),

  processThinkingRationale: z.string().optional(),
  practicalAutomationRationale: z.string().optional(),
  clarityCommunicationRationale: z.string().optional(),
  executionLogicRationale: z.string().optional(),
  reliabilityAwarenessRationale: z.string().optional(),

  totalScore: z.number().min(0).max(25).optional(),
  outcome: Outcome.optional(),
  draftedEmailSubject: z.string().optional(),
  draftedEmailBody: z.string().optional(),

  status: Status,
  sendTriggered: z.boolean(),
  sentAt: z.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
});

export type CandidateRecord = z.infer<typeof CandidateRecordSchema>;
