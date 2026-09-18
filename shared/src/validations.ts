import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(2).max(120),
    role: z.enum(["STUDENT", "COMPANY"]),
    city: z.string().trim().min(2).max(80),
    school: z.string().trim().min(2).max(160).optional(),
    field: z.string().trim().min(2).max(120).optional(),
    legalName: z.string().trim().min(2).max(180).optional(),
    sector: z.string().trim().min(2).max(120).optional(),
  })
  .superRefine((values, context) => {
    if (values.role === "STUDENT" && (!values.school || !values.field)) {
      context.addIssue({
        code: "custom",
        path: ["school"],
        message: "École et filière obligatoires pour un étudiant.",
      });
    }
    if (values.role === "COMPANY" && (!values.legalName || !values.sector)) {
      context.addIssue({
        code: "custom",
        path: ["legalName"],
        message: "Raison sociale et secteur obligatoires pour une entreprise.",
      });
    }
  });

export const missionInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  categoryId: z.string().cuid(),
  city: z.string().trim().min(2).max(80),
  requiredSkills: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
  estimatedHours: z.number().int().positive().max(500),
  budget: z.number().int().positive().max(100000000),
  deadline: z.coerce.date(),
});

export const applicationInputSchema = z.object({
  coverLetter: z.string().trim().min(20).max(3000),
});
export const deliverableInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  url: z.string().url().optional(),
});
export const disputeInputSchema = z.object({
  reason: z.string().trim().min(20).max(3000),
});
export const messageInputSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export const decisionInputSchema = z.object({
  studentShare: z.number().int().min(0).max(100),
  decisionNote: z.string().trim().min(20).max(3000),
});
