import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  telegramId: z.number().optional(),
  role: z.enum(["manager", "worker", "supervisor"]),
  status: z.enum(["pending", "active", "blocked", "rejected"]),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string(),
  country: z.string().optional(),
  position: z.string().optional(),
  specialization: z.string().optional(),
  hourlyRate: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  createdAt: z.string().optional(),
  applicationCorrectionsNeeded: z.boolean().optional(),
  applicationFeedback: z
    .object({
      action: z.enum(["reject", "return"]).optional(),
      reasons: z.array(z.string()).optional(),
      comment: z.string().optional(),
      reviewedAt: z.string().optional(),
    })
    .optional(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
  user: userSchema,
});

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });

export const projectWorkerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  confirmationStatus: z.string(),
  hourlyRate: z.string().optional(),
  specialization: z.string().optional(),
  position: z.string().optional(),
  assignedAt: z.string().optional(),
  invitedAt: z.string().optional(),
});

export const projectContactSchema = z.object({
  role: z.string(),
  name: z.string(),
  phone: z.string(),
});

export const myProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  clientName: z.string().optional(),
  status: z.string(),
  siteStatus: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  role: z.string(),
  confirmationStatus: z.string(),
  assignedAt: z.string(),
  contacts: z.array(projectContactSchema).optional(),
  projectWorkers: z.array(projectWorkerSchema).optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  estimateId: z.string().nullable().optional(),
  supervisorId: z.string().nullable().optional(),
  name: z.string(),
  location: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.string(),
  type: z.string(),
  siteStatus: z.string(),
  downtimeHours: z.string().optional(),
  budget: z.string(),
  spent: z.string(),
  workers: z.number(),
  confirmed: z.number(),
  reportsOnReview: z.number(),
  projectWorkers: z.array(projectWorkerSchema).optional(),
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  comment: z.string().optional(),
});

export const workerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  country: z.string().optional(),
  role: z.string(),
  status: z.string(),
  position: z.string().optional(),
  specialization: z.string().optional(),
  hourlyRate: z.string().optional(),
  createdAt: z.string().optional(),
  projectName: z.string().optional(),
  projectStatus: z.string().optional(),
  internalComment: z.string().optional(),
  telegramUsername: z.string().optional(),
  blockReason: z.string().optional(),
  blockedAt: z.string().optional(),
  blockProjectId: z.string().optional(),
  blockProjectName: z.string().optional(),
  applicationCorrectionsNeeded: z.boolean().optional(),
  applicationFeedback: z
    .object({
      action: z.enum(["reject", "return"]).optional(),
      reasons: z.array(z.string()).optional(),
      comment: z.string().optional(),
      reviewedAt: z.string().optional(),
    })
    .optional(),
});

export const workerProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  clientName: z.string(),
  status: z.string(),
  siteStatus: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  role: z.string(),
  confirmationStatus: z.string(),
  assignedAt: z.string(),
});

export const supervisorCandidatesSchema = z.object({
  onProject: z.array(workerSchema),
  available: z.array(workerSchema),
});

export const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  serialNumber: z.string().optional(),
  toolType: z.string().optional(),
  model: z.string().optional(),
  controlType: z.string(),
  status: z.string(),
  calibrationDueAt: z.string().nullable().optional(),
  calibrationPeriodMonths: z.number().optional(),
  usageLimit: z.number(),
  usageCount: z.number(),
  usageUnit: z.string().optional(),
  costCents: z.number().optional(),
  purchaseDate: z.string().nullable().optional(),
  comment: z.string().optional(),
  problemType: z.string().optional(),
  problemComment: z.string().optional(),
  problemReportedAt: z.string().nullable().optional(),
});

export const toolAssignmentSchema = z.object({
  id: z.string(),
  toolId: z.string().optional(),
  projectId: z.string(),
  projectName: z.string().optional(),
  responsibleUserId: z.string().nullable().optional(),
  responsibleName: z.string().optional(),
  responsibleRole: z.string().optional(),
  assignedAt: z.string(),
  returnedAt: z.string().nullable().optional(),
  conditionOnReturn: z.string().optional(),
  usedInReport: z.boolean().optional(),
});

export const toolListItemSchema = toolSchema.extend({
  activeAssignment: toolAssignmentSchema.nullable().optional(),
  lastReturnedAt: z.string().nullable().optional(),
  plannedReturnAt: z.string().nullable().optional(),
});

export const toolCalibrationSchema = z.object({
  id: z.string(),
  toolId: z.string().optional(),
  calibratedAt: z.string(),
  nextDueAt: z.string().nullable().optional(),
  performerName: z.string().optional(),
  notes: z.string().optional(),
});

export const toolDetailSchema = toolSchema.extend({
  activeAssignment: toolAssignmentSchema.nullable().optional(),
  plannedReturnAt: z.string().nullable().optional(),
  assignmentHistory: z.array(toolAssignmentSchema).optional(),
  calibrations: z.array(toolCalibrationSchema).optional(),
});

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  notificationType: z.string(),
  link: z.string().optional(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const sendProjectNotificationsResponseSchema = z.object({
  sent: z.number(),
});

export const urgentActionSchema = z.object({
  key: z.string(),
  count: z.number(),
  title: z.string(),
  preview: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      label: z.string(),
    }),
  ),
});

export const problemProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  siteStatus: z.string(),
  issue: z.string(),
  downtimeHours: z.string().optional(),
});

export const activityItemSchema = z.object({
  id: z.string(),
  actorName: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  label: z.string(),
  createdAt: z.string(),
});

export const documentSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  documentType: z.string().optional(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  ownerId: z.string().optional(),
  createdAt: z.string(),
});

export const documentAccessUrlSchema = z.object({
  url: z.string(),
  expiresAt: z.string(),
  disposition: z.enum(["inline", "attachment"]),
  mimeType: z.string(),
  filename: z.string(),
});

export const projectWorkerDocumentItemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  expenseType: z.string(),
  createdAt: z.string(),
});

export const projectWorkerDocumentsGroupSchema = z.object({
  workerId: z.string(),
  workerName: z.string(),
  documents: z.array(projectWorkerDocumentItemSchema),
});

export const estimateBlockSchema = z.object({
  id: z.string(),
  blockType: z.string(),
  sortOrder: z.number(),
  title: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.string().optional(),
  role: z.string().optional(),
  hours: z.string().optional(),
  rate: z.string().optional(),
  amount: z.string().optional(),
  comment: z.string().optional(),
});

export const estimateSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable().optional(),
  name: z.string(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  comment: z.string().optional(),
  status: z.string(),
  totalAmount: z.string().optional(),
  linkedProjectId: z.string().nullable().optional(),
  blocks: z.array(estimateBlockSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const estimateTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  blocks: z.array(estimateBlockSchema).optional(),
  createdAt: z.string().optional(),
});

export const reportExpenseSchema = z.object({
  id: z.string(),
  expenseType: z.string(),
  amount: z.string(),
  comment: z.string().optional(),
  documentId: z.string().nullable().optional(),
  documentFilename: z.string().nullable().optional(),
});

export const workerReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string().optional(),
  workerId: z.string(),
  workerName: z.string().optional(),
  weekStart: z.string(),
  weekEnd: z.string(),
  hoursMon: z.string().optional(),
  hoursTue: z.string().optional(),
  hoursWed: z.string().optional(),
  hoursThu: z.string().optional(),
  hoursFri: z.string().optional(),
  hoursSat: z.string().optional(),
  hoursSun: z.string().optional(),
  description: z.string().optional(),
  status: z.string().transform((s) => (s === "accepted" ? "approved" : s)),
  totalHours: z.string().optional(),
  totalAmount: z.string().optional(),
  expensesTotal: z.string().optional(),
  managerComment: z.string().optional(),
  hourlyRate: z.string().optional(),
  submittedAt: z.string().optional(),
  expenses: z.array(reportExpenseSchema).optional(),
});

export const crewMemberSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const attachmentPreviewSchema = z.object({
  id: z.string(),
  filename: z.string(),
  documentType: z.string(),
});

export const projectIssueSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  number: z.number(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  sourceReportId: z.string().optional(),
});

export const supervisorReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string().optional(),
  supervisorId: z.string(),
  supervisorName: z.string().optional(),
  reportDate: z.string(),
  siteStatus: z.string().optional(),
  description: z.string().optional(),
  transcription: z.string().optional(),
  status: z.string().transform((s) => (s === "accepted" ? "approved" : s)),
  managerComment: z.string().optional(),
  downtimeHours: z.string().optional(),
  downtimeReason: z.string().optional(),
  submittedAt: z.string().optional(),
  voiceDocumentId: z.string().optional(),
  completedWorks: z.string().optional(),
  issueCategory: z.string().optional(),
  issueDescription: z.string().optional(),
  crewPresent: z.array(crewMemberSchema).optional(),
  relatedIssue: projectIssueSchema.optional(),
  linkedIssues: z.array(projectIssueSchema).optional(),
  attachmentsPreview: z.array(attachmentPreviewSchema).optional(),
  photoCount: z.number().optional(),
});

export const financeOverviewSchema = z.object({
  totalBudget: z.string(),
  totalSpent: z.string(),
  totalRemaining: z.string(),
  pendingReview: z.string().optional().default("0"),
  activeProjects: z.number(),
});

export const projectFinanceWorkerSchema = z.object({
  workerId: z.string(),
  workerName: z.string(),
  totalHours: z.string(),
  totalAmount: z.string(),
  extraExpenses: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
});

export const projectFinanceCategorySchema = z.object({
  category: z.string(),
  amount: z.string(),
  count: z.number().optional(),
  percentage: z.number(),
});

export const projectFinanceLossSchema = z.object({
  id: z.string(),
  title: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  downtimeHours: z.string(),
  lossAmount: z.string(),
  siteStatus: z.string(),
  issueStatus: z.string().optional(),
});

export const projectFinanceSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  projectStatus: z.string().optional(),
  budget: z.string(),
  spent: z.string(),
  remaining: z.string(),
  laborCost: z.string().optional(),
  expenseCost: z.string().optional(),
  pendingReviewAmount: z.string().optional().default("0"),
  totalLossAmount: z.string().optional().default("0"),
  workers: z.array(projectFinanceWorkerSchema).optional().default([]),
  categories: z.array(projectFinanceCategorySchema).optional().default([]),
  losses: z.array(projectFinanceLossSchema).optional().default([]),
});

export const workerFinanceSchema = z.object({
  workerId: z.string(),
  workerName: z.string(),
  totalHours: z.string(),
  totalPaid: z.string(),
  activeProjects: z.number(),
});

export const expenseCategorySchema = z.object({
  category: z.string(),
  amount: z.string(),
  count: z.number(),
});

export const workerProjectFinanceSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  totalHours: z.string(),
  projectAmount: z.string(),
  extraExpenses: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
});

export const workerFinanceMineSchema = z.object({
  totalHours: z.string(),
  confirmedHours: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
  projects: z.array(workerProjectFinanceSchema),
});

export const workerResourceStatSchema = z.object({
  specialization: z.string(),
  total: z.number(),
  available: z.number(),
  onProject: z.number(),
});
