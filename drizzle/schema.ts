import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const committees = mysqlTable("committees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  leadName: varchar("leadName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  primaryCommitteeId: int("primaryCommitteeId"),
  secondaryCommitteeId: int("secondaryCommitteeId"),
  role: varchar("role", { length: 100 }).default("عضو").notNull(),
  status: mysqlEnum("status", ["active", "review", "unresponsive", "paused", "archived"]).default("active").notNull(),
  skills: text("skills"),
  growthFocus: text("growthFocus"),
  points: int("points").default(0).notNull(),
  monthlyScore: int("monthlyScore").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt"),
  notes: text("notes"),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  committeeId: int("committeeId"),
  assigneeId: int("assigneeId"),
  reviewerId: int("reviewerId"),
  priority: mysqlEnum("priority", ["low", "normal", "high"]).default("normal").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "submitted", "needs_revision", "completed", "late", "cancelled"]).default("todo").notNull(),
  dueAt: timestamp("dueAt"),
  submittedAt: timestamp("submittedAt"),
  fileUrl: varchar("fileUrl", { length: 500 }),
  taskScore: int("taskScore").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const monthlyEvaluations = mysqlTable("monthlyEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  month: varchar("month", { length: 20 }).notNull(),
  commitment: int("commitment").default(0).notNull(),
  quality: int("quality").default(0).notNull(),
  engagement: int("engagement").default(0).notNull(),
  growth: int("growth").default(0).notNull(),
  teamwork: int("teamwork").default(0).notNull(),
  totalScore: int("totalScore").default(0).notNull(),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pointsLedger = mysqlTable("pointsLedger", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  points: int("points").notNull(),
  activity: varchar("activity", { length: 180 }).notNull(),
  reason: text("reason"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const awards = mysqlTable("awards", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  type: varchar("type", { length: 120 }).notNull(),
  period: varchar("period", { length: 30 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["draft", "approved", "issued"]).default("draft").notNull(),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type Committee = typeof committees.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type MonthlyEvaluation = typeof monthlyEvaluations.$inferSelect;
export type Award = typeof awards.$inferSelect;
export type PointEntry = typeof pointsLedger.$inferSelect;

export const committeeNames = [
  "لجنة التخطيط والأفكار",
  "لجنة الجرافيك",
  "لجنة التصوير",
  "لجنة المونتاج",
  "لجنة الرايتنج والمحتوى",
  "لجنة الأرشفة",
] as const;

export const awardTypes = [
  "نجم الشهر",
  "أفضل التزام",
  "أفضل تطور",
  "أفضل فكرة",
  "أفضل شغل جماعي",
  "أفضل عضو جديد",
  "أفضل تغطية",
  "أفضل تصميم",
  "أفضل مونتاج",
  "أفضل عضو داعم للفريق",
] as const;

export function evaluationLevel(score: number) {
  if (score >= 90) return "متميز";
  if (score >= 75) return "نشط جدًا";
  if (score >= 60) return "جيد ويحتاج إلى تطوير مستمر";
  if (score >= 40) return "يحتاج إلى متابعة";
  return "يحتاج إلى مراجعة فردية";
}

export function taskStatusLabel(status: string) {
  return ({ todo: "لم تبدأ", in_progress: "جاري التنفيذ", submitted: "تم التسليم", needs_revision: "تحتاج تعديل", completed: "مكتملة", late: "متأخرة", cancelled: "ملغاة" } as Record<string, string>)[status] ?? status;
}

export function memberStatusLabel(status: string) {
  return ({ active: "نشط", review: "تحت المتابعة", unresponsive: "غير مستجيب", paused: "متوقف", archived: "مؤرشف" } as Record<string, string>)[status] ?? status;
}

export function priorityLabel(priority: string) {
  return ({ low: "منخفضة", normal: "عادية", high: "عالية" } as Record<string, string>)[priority] ?? priority;
}

export function monthLabel() {
  return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(new Date());
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

export function scoreTone(score: number) {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 60) return "steady";
  return "needs";
}

export function demoStats() {
  return { members: 24, openTasks: 8, completedTasks: 31, averageScore: 82 };
}

export function demoMembers() {
  return [
    { name: "جوي", committee: "التخطيط والأفكار", score: 92, points: 128, status: "نشط", initials: "ج" },
    { name: "جورج سامح", committee: "التصوير", score: 86, points: 116, status: "نشط", initials: "ج" },
    { name: "كارين", committee: "الرايتنج والمحتوى", score: 81, points: 104, status: "نشط", initials: "ك" },
    { name: "هايدي", committee: "المونتاج", score: 76, points: 88, status: "تحت المتابعة", initials: "ه" },
  ];
}

export function demoTasks() {
  return [
    { title: "استكمال حصر أعضاء ميديا هب", committee: "التخطيط والأفكار", status: "جاري التنفيذ", priority: "عالية", due: "غدًا" },
    { title: "تجهيز إعلان ورشة AI", committee: "التصوير", status: "تحتاج تعديل", priority: "عالية", due: "الأربعاء" },
    { title: "مراجعة كابشنات الورشة", committee: "الرايتنج والمحتوى", status: "مكتملة", priority: "عادية", due: "تم التسليم" },
    { title: "أرشفة ماتريال فعالية العشاء", committee: "الأرشفة", status: "تم التسليم", priority: "عادية", due: "هذا الأسبوع" },
  ];
}

export function demoCommitteeProgress() {
  return [
    { name: "التخطيط والأفكار", value: 91, color: "coral" },
    { name: "الرايتنج والمحتوى", value: 84, color: "blue" },
    { name: "التصوير", value: 78, color: "yellow" },
    { name: "الجرافيك", value: 72, color: "mint" },
    { name: "المونتاج", value: 67, color: "violet" },
  ];
}

export function demoAwards() {
  return [
    { title: "أفضل التزام", description: "للعضو الأكثر ثباتًا في التسليم والمتابعة.", color: "coral" },
    { title: "أفضل تطور", description: "لأوضح رحلة تعلم خلال الشهر.", color: "blue" },
    { title: "أفضل فكرة", description: "لفكرة تحولت إلى خطوة قابلة للتنفيذ.", color: "yellow" },
  ];
}

export function demoTimeline() {
  return [
    { label: "حصر الأعضاء", detail: "الخطوة الأولى", done: true },
    { label: "اعتماد اللجان", detail: "بعد إغلاق الفورم", done: false },
    { label: "تسجيل المهام", detail: "كل لجنة تحدّث شغلها", done: false },
    { label: "التقييم الشهري", detail: "أول دورة تجريبية", done: false },
  ];
}

export const pointsRules = [
  { label: "حضور اجتماع أو جلسة عمل", points: 2 },
  { label: "تنفيذ مهمة في الموعد", points: 10 },
  { label: "تسليم عمل بجودة ممتازة", points: 5 },
  { label: "اقتراح فكرة قابلة للتنفيذ", points: 5 },
  { label: "مساعدة عضو آخر", points: 3 },
  { label: "المشاركة في فعالية أو تغطية", points: 8 },
  { label: "التعلم أو تطبيق مهارة جديدة", points: 5 },
];

export const evaluationWeights = { commitment: 30, quality: 30, engagement: 20, growth: 10, teamwork: 10 };

export const taskStatusOptions = [
  { value: "todo", label: "لم تبدأ" },
  { value: "in_progress", label: "جاري التنفيذ" },
  { value: "submitted", label: "تم التسليم" },
  { value: "needs_revision", label: "تحتاج تعديل" },
  { value: "completed", label: "مكتملة" },
  { value: "late", label: "متأخرة" },
];

export const priorityOptions = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "عادية" },
  { value: "high", label: "عالية" },
];

export const awardStatusLabels = { draft: "مسودة", approved: "معتمدة", issued: "تم الإصدار" } as const;
