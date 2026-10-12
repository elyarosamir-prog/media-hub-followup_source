import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Award,
  BarChart3,
  Bell,
  Check,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Section = "overview" | "members" | "tasks" | "evaluations" | "awards";
type Task = { title: string; committee: string; status: string; priority: string; due: string };

type Member = { id?: number; name: string; committee: string; score: number; points: number; status: string; initials: string };

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "members", label: "الأعضاء", icon: Users },
  { id: "tasks", label: "المهام", icon: ClipboardList },
  { id: "evaluations", label: "التقييمات", icon: BarChart3 },
  { id: "awards", label: "الجوائز", icon: Award },
];

const defaultMembers: Member[] = [
  { name: "جوي", committee: "التخطيط والأفكار", score: 92, points: 128, status: "نشط", initials: "ج" },
  { name: "جورج سامح", committee: "التصوير", score: 86, points: 116, status: "نشط", initials: "ج" },
  { name: "كارين", committee: "الرايتنج والمحتوى", score: 81, points: 104, status: "نشط", initials: "ك" },
  { name: "هايدي", committee: "المونتاج", score: 76, points: 88, status: "تحت المتابعة", initials: "ه" },
];

const defaultTasks: Task[] = [
  { title: "استكمال حصر أعضاء ميديا هب", committee: "التخطيط والأفكار", status: "جاري التنفيذ", priority: "عالية", due: "غدًا" },
  { title: "تجهيز إعلان ورشة AI", committee: "التصوير", status: "تحتاج تعديل", priority: "عالية", due: "الأربعاء" },
  { title: "مراجعة كابشنات الورشة", committee: "الرايتنج والمحتوى", status: "مكتملة", priority: "عادية", due: "تم التسليم" },
  { title: "أرشفة ماتريال فعالية العشاء", committee: "الأرشفة", status: "تم التسليم", priority: "عادية", due: "هذا الأسبوع" },
];

const committees = [
  { name: "التخطيط والأفكار", progress: 91, color: "coral" },
  { name: "الرايتنج والمحتوى", progress: 84, color: "blue" },
  { name: "التصوير", progress: 78, color: "yellow" },
  { name: "الجرافيك", progress: 72, color: "mint" },
  { name: "المونتاج", progress: 67, color: "violet" },
];

const awards = [
  { title: "أفضل التزام", description: "للعضو الأكثر ثباتًا في التسليم والمتابعة.", icon: Target, color: "coral" },
  { title: "أفضل تطور", description: "لأوضح رحلة تعلم خلال الشهر.", icon: TrendingUp, color: "blue" },
  { title: "أفضل فكرة", description: "لفكرة تحولت إلى خطوة قابلة للتنفيذ.", icon: Sparkles, color: "yellow" },
];

const scoreRows = [
  { label: "الالتزام بالمواعيد وتنفيذ التكليف", value: 30, color: "coral" },
  { label: "جودة العمل وقابليته للاستخدام", value: 30, color: "blue" },
  { label: "التفاعل والتواصل مع اللجنة", value: 20, color: "yellow" },
  { label: "التعلم والتطور وطرح الأسئلة", value: 10, color: "mint" },
  { label: "مساعدة الفريق والمبادرة", value: 10, color: "violet" },
];

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusClass(status: string) {
  if (status === "مكتملة" || status === "تم التسليم" || status === "نشط") return "status-success";
  if (status === "تحتاج تعديل" || status === "تحت المتابعة") return "status-warning";
  return "status-progress";
}

function priorityClass(priority: string) {
  return priority === "عالية" ? "priority-high" : "priority-normal";
}

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const memberQuery = trpc.workspace.members.useQuery(undefined, { enabled: isAuthenticated });
  const committeeQuery = trpc.workspace.committees.useQuery(undefined, { enabled: isAuthenticated });
  const createMember = trpc.workspace.createMember.useMutation();
  const login = trpc.auth.login.useMutation();
  const queryUtils = trpc.useUtils();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const members = useMemo<Member[]>(() => {
    if (!memberQuery.data?.length) return defaultMembers;
    const committeeMap = new Map((committeeQuery.data ?? []).map((committee) => [committee.id, committee.name]));
    return memberQuery.data.map((member) => ({
      id: member.id,
      name: member.fullName,
      committee: committeeMap.get(member.primaryCommitteeId ?? -1) ?? "لم تعتمد اللجنة بعد",
      score: member.monthlyScore,
      points: member.points,
      status: member.status === "active" ? "نشط" : member.status === "review" ? "تحت المتابعة" : "غير نشط",
      initials: initialsFor(member.fullName),
    }));
  }, [committeeQuery.data, memberQuery.data]);

  const filteredMembers = useMemo(
    () => members.filter((member) => `${member.name} ${member.committee}`.toLowerCase().includes(search.toLowerCase())),
    [members, search],
  );
  const filteredTasks = useMemo(
    () => tasks.filter((task) => `${task.title} ${task.committee} ${task.status}`.toLowerCase().includes(search.toLowerCase())),
    [tasks, search],
  );

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoginError("");
    try {
      await login.mutateAsync({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
      await queryUtils.auth.me.invalidate();
      setIsLoginOpen(false);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "حصلت مشكلة في تسجيل الدخول.");
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const handleNav = (section: Section) => {
    setActiveSection(section);
    setSearch("");
    setIsSidebarOpen(false);
  };

  const handleTaskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    setTasks((current) => [
      { title, committee: String(form.get("committee") || "التخطيط والأفكار"), status: "لم تبدأ", priority: String(form.get("priority") || "عادية"), due: String(form.get("due") || "غير محدد") },
      ...current,
    ]);
    setIsTaskModalOpen(false);
    showToast("اتضافت المهمة وظهرت في قائمة المتابعة.");
    event.currentTarget.reset();
  };

  const handleMemberSubmit = async (input: { fullName: string; phone: string; skills: string; growthFocus: string }) => {
    await createMember.mutateAsync({
      fullName: input.fullName,
      phone: input.phone || undefined,
      skills: input.skills || undefined,
      growthFocus: input.growthFocus || undefined,
    });
    await queryUtils.workspace.members.invalidate();
    setIsMemberModalOpen(false);
    showToast("اتضاف العضو للحصر بنجاح.");
  };

  const sectionLabel = navItems.find((item) => item.id === activeSection)?.label ?? "نظرة عامة";
  const userName = user?.name || "فريق ميديا هب";

  return (
    <div className="app-shell" dir="rtl">
      <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><span>MH</span></div>
          <div>
            <strong>Media Hub</strong>
            <span>نادي التطوع</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setIsSidebarOpen(false)} aria-label="إغلاق القائمة"><X size={18} /></button>
        </div>

        <div className="sidebar-label">مساحة العمل</div>
        <nav className="main-nav" aria-label="التنقل الرئيسي">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeSection === id ? "active" : ""}`} onClick={() => handleNav(id)}>
              <Icon size={19} strokeWidth={activeSection === id ? 2.3 : 1.8} />
              <span>{label}</span>
              {id === "tasks" && <span className="nav-count">8</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-label secondary-label">الإدارة</div>
        <nav className="main-nav">
          <button className="nav-item" onClick={() => showToast("الإعدادات هتتفتح بعد تسجيل دخول المسؤول.")}><Settings2 size={19} /><span>الإعدادات</span></button>
          <button className="nav-item" onClick={() => showToast("سجل التعديلات هيظهر مع البيانات الحقيقية.")}><FileText size={19} /><span>سجل التعديلات</span></button>
          <button className="nav-item" onClick={() => showToast("المساعدة: ابدأوا بالحصر ثم اعتماد اللجان.")}><CircleHelp size={19} /><span>المساعدة</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="setup-card">
            <div className="setup-icon"><Sparkles size={17} /></div>
            <div>
              <strong>نسخة البداية</strong>
              <span>جاهزة لبيانات الحصر</span>
            </div>
            <div className="setup-progress"><span /></div>
          </div>
          <div className="sidebar-footer">
            <span>MVP 1.0</span>
            <span>·</span>
            <span>جمعية أنا مصري</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
          <div className="crumbs"><span>Media Hub</span><ChevronLeft size={15} /><strong>{sectionLabel}</strong></div>
          <div className="topbar-actions">
            <span className="status-dot"><i /> النظام جاهز</span>
            <button className="icon-button notification-button" aria-label="الإشعارات" onClick={() => showToast("مفيش إشعارات جديدة حاليًا.")}><Bell size={19} /><b /></button>
            {isAuthenticated ? (
              <div className="profile-menu">
                <div className="avatar">{initialsFor(userName)}</div>
                <div className="profile-copy"><strong>{userName}</strong><span>{user?.role === "admin" ? "مسؤول النظام" : "عضو الفريق"}</span></div>
                <button className="logout-button" onClick={() => logout()} aria-label="تسجيل الخروج"><LogOut size={16} /></button>
              </div>
            ) : (
              <button className="login-button" onClick={() => setIsLoginOpen(true)} disabled={loading}><UserRound size={16} /> دخول المسؤول</button>
            )}
          </div>
        </header>

        <div className="content-wrap">
          <div className="preview-banner"><span><Sparkles size={15} /> معاينة قبل إدخال بيانات الفريق</span><span>الخطوة التالية: إغلاق فورم الحصر وإدخال الأعضاء</span></div>

          {activeSection === "overview" && (
            <>
              <section className="hero-section">
                <div className="hero-copy">
                  <div className="eyebrow"><span className="eyebrow-line" /> نظام متابعة وتقييم ميديا هب</div>
                  <h1>الشغل باين،<br /><em>والتطور محسوب.</em></h1>
                  <p>نظام واحد يخلّي كل مهمة، كل تقييم، وكل خطوة تطوير واضحة للفريق.</p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => handleNav("tasks")}><ClipboardList size={17} /> شوفوا الشغل</button>
                    <button className="ghost-button" onClick={() => handleNav("members")}><Users size={17} /> ابدأوا الحصر</button>
                  </div>
                  <div className="hero-meta"><span><Check size={14} /> موبايل أولًا</span><span><Check size={14} /> تقييم شخصي</span><span><Check size={14} /> قابل للتوسع</span></div>
                </div>
                <div className="hero-visual">
                  <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                  <div className="hero-card-stack">
                    <div className="floating-chip chip-top"><span className="chip-dot coral-dot" /> مهمة جديدة <strong>+10</strong></div>
                    <div className="metric-orb"><span>82</span><small>متوسط التقييم</small><div className="orb-ring" /></div>
                    <div className="floating-chip chip-bottom"><span className="chip-dot mint-dot" /> التقدم محسوب <strong>+12%</strong></div>
                  </div>
                  <div className="hero-note"><Flag size={15} /> نبدأ صغير، نجرّب، ثم نوسّع.</div>
                </div>
              </section>

              <section className="stats-grid">
                <MetricCard icon={Users} label="أعضاء نشطون" value="24" note="بيانات معاينة" tone="coral" trend="+4 هذا الشهر" />
                <MetricCard icon={ClipboardList} label="مهام مفتوحة" value="8" note="تحتاج متابعة" tone="blue" trend="3 عالية الأولوية" />
                <MetricCard icon={Check} label="مهام مكتملة" value="31" note="خلال الدورة" tone="mint" trend="72% معدل إنجاز" />
                <MetricCard icon={BarChart3} label="متوسط التقييم" value="82%" note="أداء الفريق" tone="yellow" trend="+6% عن السابق" />
              </section>

              <div className="dashboard-grid">
                <section className="panel tasks-panel">
                  <PanelHeader title="آخر المهام" subtitle="نظرة سريعة على شغل الفريق" action="عرض كل المهام" onAction={() => handleNav("tasks")} />
                  <div className="task-table">
                    {defaultTasks.map((task) => <TaskRow key={task.title} task={task} />)}
                  </div>
                </section>
                <section className="panel progress-panel">
                  <PanelHeader title="نبض اللجان" subtitle="نسبة الإنجاز الحالية" action="التفاصيل" onAction={() => handleNav("evaluations")} />
                  <div className="committee-list">{committees.map((committee) => <CommitteeProgress key={committee.name} {...committee} />)}</div>
                  <div className="panel-footnote"><span className="mini-spark"><TrendingUp size={15} /></span> أعلى تقدم حاليًا في التخطيط والأفكار</div>
                </section>
              </div>

              <div className="bottom-grid">
                <section className="panel members-panel">
                  <PanelHeader title="أعضاء الفريق" subtitle="آخر الأعضاء نشاطًا" action="عرض الكل" onAction={() => handleNav("members")} />
                  <div className="member-row-list">{members.slice(0, 4).map((member) => <MemberRow key={member.name} member={member} />)}</div>
                </section>
                <section className="panel roadmap-panel">
                  <PanelHeader title="مسار البداية" subtitle="من الحصر إلى التقييم" action="" />
                  <div className="roadmap">{["حصر الأعضاء", "اعتماد اللجان", "تسجيل المهام", "التقييم الشهري"].map((step, index) => <div className={`roadmap-step ${index === 0 ? "done" : ""}`} key={step}><div className="roadmap-marker">{index === 0 ? <Check size={13} /> : index + 1}</div><div><strong>{step}</strong><span>{index === 0 ? "الخطوة الأولى" : index === 1 ? "بعد إغلاق الفورم" : index === 2 ? "كل لجنة تحدّث شغلها" : "أول دورة تجريبية"}</span></div></div>)}</div>
                </section>
              </div>
            </>
          )}

          {activeSection === "members" && <MembersView members={filteredMembers} search={search} setSearch={setSearch} onBack={() => handleNav("overview")} onAdd={() => setIsMemberModalOpen(true)} />}
          {activeSection === "tasks" && <TasksView tasks={filteredTasks} search={search} setSearch={setSearch} onAdd={() => setIsTaskModalOpen(true)} />}
          {activeSection === "evaluations" && <EvaluationsView members={members} />}
          {activeSection === "awards" && <AwardsView />}

          <footer className="page-footer"><span>Media Hub · نادي التطوع · جمعية أنا مصري</span><span>{new Date().getFullYear()} · نسخة البداية</span></footer>
        </div>
      </main>

      {isTaskModalOpen && <TaskModal onClose={() => setIsTaskModalOpen(false)} onSubmit={handleTaskSubmit} />}
      {isLoginOpen && <LoginModal onClose={() => { setIsLoginOpen(false); setLoginError(""); }} onSubmit={handleLoginSubmit} saving={login.isPending} error={loginError} />}
      {isMemberModalOpen && <MemberModal onClose={() => setIsMemberModalOpen(false)} onSubmit={handleMemberSubmit} saving={createMember.isPending} />}
      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, trend }: { icon: typeof Users; label: string; value: string; note: string; tone: string; trend: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div><div className="metric-trend">{trend}</div></div>;
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction?: () => void }) {
  return <div className="panel-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="text-button" onClick={onAction}>{action}<ChevronLeft size={15} /></button>}</div>;
}

function TaskRow({ task }: { task: Task }) {
  return <div className="task-row"><div className="task-main"><span className={`task-marker ${statusClass(task.status)}`}><Check size={13} /></span><div><strong>{task.title}</strong><span>{task.committee}</span></div></div><span className={`status-pill ${statusClass(task.status)}`}>{task.status}</span><span className={`priority-pill ${priorityClass(task.priority)}`}>{task.priority}</span><span className="due-date"><Clock3 size={14} />{task.due}</span></div>;
}

function CommitteeProgress({ name, progress, color }: { name: string; progress: number; color: string }) {
  return <div className="committee-progress"><div className="committee-progress-head"><span><i className={`legend-dot ${color}`} />{name}</span><strong>{progress}%</strong></div><div className="progress-track"><span className={color} style={{ width: `${progress}%` }} /></div></div>;
}

function MemberRow({ member }: { member: Member }) {
  return <div className="member-row"><div className="member-avatar">{member.initials}</div><div className="member-details"><strong>{member.name}</strong><span>{member.committee}</span></div><div className="member-score"><strong>{member.score}%</strong><span>تقييم</span></div><div className={`member-status ${member.status === "نشط" ? "active" : "review"}`}><i />{member.status}</div></div>;
}

function MembersView({ members, search, setSearch, onBack, onAdd }: { members: Member[]; search: string; setSearch: (value: string) => void; onBack: () => void; onAdd: () => void }) {
  return <section className="section-view"><SectionIntro eyebrow="ملف الفريق" title="الأعضاء" description="قائمة أعضاء ميديا هب، لجانهم، وتقدمهم في الدورة الحالية." actionLabel="إضافة عضو" onAction={onAdd} />
    <div className="view-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو اللجنة..." /></div><button className="filter-button" onClick={onBack}>العودة للنظرة العامة</button></div>
    <div className="member-grid">{members.map((member) => <div className="member-card" key={member.name}><div className="member-card-top"><div className="member-avatar large">{member.initials}</div><span className={`status-pill ${member.status === "نشط" ? "status-success" : "status-warning"}`}>{member.status}</span></div><h3>{member.name}</h3><p>{member.committee}</p><div className="member-card-stats"><div><strong>{member.score}%</strong><span>التقييم</span></div><div><strong>{member.points}</strong><span>النقاط</span></div></div><div className="card-progress"><span style={{ width: `${member.score}%` }} /></div><div className="member-card-foot"><span>آخر نشاط</span><strong>هذا الأسبوع</strong></div></div>)}</div>
    {!members.length && <EmptyState label="مفيش نتائج مطابقة" />}
  </section>;
}

function TasksView({ tasks, search, setSearch, onAdd }: { tasks: Task[]; search: string; setSearch: (value: string) => void; onAdd: () => void }) {
  return <section className="section-view"><SectionIntro eyebrow="سير العمل" title="المهام" description="كل مهمة لها مسؤول وموعد وحالة واضحة." actionLabel="مهمة جديدة" onAction={onAdd} />
    <div className="view-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المهام..." /></div><div className="toolbar-pills"><span className="toolbar-pill active">الكل <b>{tasks.length}</b></span><span className="toolbar-pill">عالية الأولوية</span><span className="toolbar-pill">مكتملة</span></div></div>
    <div className="panel full-panel"><div className="task-table task-table-large">{tasks.map((task) => <TaskRow key={`${task.title}-${task.due}`} task={task} />)}</div>{!tasks.length && <EmptyState label="مفيش مهام مطابقة" />}</div>
    <div className="callout-grid"><div className="callout-card coral-tint"><Target size={20} /><div><strong>نقطة مهمة</strong><span>المراجعة أسبوعية والتقييم شهري، مش كل يوم.</span></div></div><div className="callout-card blue-tint"><ClipboardList size={20} /><div><strong>قاعدة الشغل</strong><span>لو المهمة اتأخرت، نسجل السبب ونكمّل بوضوح.</span></div></div></div>
  </section>;
}

function EvaluationsView({ members }: { members: Member[] }) {
  return <section className="section-view"><SectionIntro eyebrow="التطور محسوب" title="التقييمات" description="التقييم وصف لأداء الدورة الحالية، وليس حكمًا نهائيًا على العضو." actionLabel="بدء تقييم شهري" onAction={() => undefined} />
    <div className="evaluation-layout"><div className="panel score-panel"><div className="score-panel-head"><div><span className="small-eyebrow">متوسط الفريق</span><strong>82<span>%</span></strong></div><div className="score-circle"><span>+6%</span><small>عن السابق</small></div></div><div className="score-bars">{scoreRows.map((row) => <div className="score-bar" key={row.label}><div><span>{row.label}</span><strong>{row.value}</strong></div><div className="progress-track"><span className={row.color} style={{ width: `${row.value * 2.8}%` }} /></div></div>)}</div></div><div className="panel evaluation-list"><PanelHeader title="آخر تقييمات" subtitle="دورة سبتمبر 2026" action="" />{members.map((member) => <div className="evaluation-row" key={member.name}><div className="member-avatar">{member.initials}</div><div className="evaluation-member"><strong>{member.name}</strong><span>{member.committee}</span></div><div className={`evaluation-score ${member.score >= 85 ? "high" : "mid"}`}><strong>{member.score}%</strong><span>{member.score >= 90 ? "متميز" : member.score >= 75 ? "نشط جدًا" : "يحتاج متابعة"}</span></div><ChevronLeft size={16} /></div>)}</div></div>
    <div className="principles-card"><div className="principle-icon"><Sparkles size={20} /></div><div><strong>تقييم عادل وواضح</strong><p>يعتمد على سجل المهام، جودة الشغل، التواصل، التطور، ومساعدة الفريق — مش على عدد الرسائل أو التفاعل الشكلي.</p></div><button className="text-button">قواعد التقييم <ChevronLeft size={15} /></button></div>
  </section>;
}

function AwardsView() {
  return <section className="section-view"><SectionIntro eyebrow="التقدير له وقته" title="الجوائز والشهادات" description="نقدّر الشغل الحقيقي والتطور، ونحوّل المجهود لحافز مستمر." actionLabel="إضافة جائزة" onAction={() => undefined} />
    <div className="award-grid">{awards.map(({ title, description, icon: Icon, color }) => <div className={`award-card ${color}`} key={title}><div className="award-icon"><Icon size={21} /></div><div><h3>{title}</h3><p>{description}</p></div><ChevronLeft size={18} /></div>)}</div>
    <div className="panel points-panel"><PanelHeader title="قواعد النقاط" subtitle="النقاط اليومية تساعدنا نوثق المشاركة، لكنها لا تستبدل التقييم الشهري." action="" /><div className="points-grid"><PointItem label="تنفيذ مهمة في الموعد" points="+10" /><PointItem label="مشاركة في فعالية أو تغطية" points="+8" /><PointItem label="اقتراح فكرة قابلة للتنفيذ" points="+5" /><PointItem label="مساعدة عضو آخر" points="+3" /><PointItem label="حضور اجتماع أو جلسة عمل" points="+2" /></div></div>
    <div className="certificate-strip"><div className="certificate-mark"><Award size={22} /></div><div><strong>الشهادات بعد المراجعة</strong><span>شهادة مشاركة · شهادة تميز · شهادة التزام · شهادة مساهمة في فعالية</span></div><button className="ghost-button">شوفوا الأنواع <ChevronLeft size={15} /></button></div>
  </section>;
}

function PointItem({ label, points }: { label: string; points: string }) {
  return <div className="point-item"><span><Check size={14} />{label}</span><strong>{points}</strong></div>;
}

function SectionIntro({ eyebrow, title, description, actionLabel, onAction }: { eyebrow: string; title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <div className="section-intro"><div><span className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</span><h1>{title}</h1><p>{description}</p></div><button className="primary-button" onClick={onAction}><Plus size={17} /> {actionLabel}</button></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state"><ClipboardList size={24} /><strong>{label}</strong><span>ابدأوا بإدخال بيانات الفريق بعد إغلاق الفورم.</span></div>;
}

function TaskModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title"><div className="modal-head"><div><span className="small-eyebrow">سير العمل</span><h2 id="task-modal-title">إضافة مهمة جديدة</h2></div><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></div><form onSubmit={onSubmit}><label>اسم المهمة<input name="title" required placeholder="مثال: تجهيز بوستر الورشة" autoFocus /></label><label>اللجنة<select name="committee" defaultValue="التخطيط والأفكار"><option>التخطيط والأفكار</option><option>الجرافيك</option><option>التصوير</option><option>المونتاج</option><option>الرايتنج والمحتوى</option><option>الأرشفة</option></select></label><div className="form-row"><label>الأولوية<select name="priority" defaultValue="عادية"><option>عادية</option><option>عالية</option><option>منخفضة</option></select></label><label>موعد التسليم<input name="due" placeholder="مثال: الخميس" /></label></div><div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>إلغاء</button><button type="submit" className="primary-button"><Check size={16} /> حفظ المهمة</button></div></form></div></div>;
}

function MemberModal({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (input: { fullName: string; phone: string; skills: string; growthFocus: string }) => Promise<void>; saving: boolean }) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      fullName: String(form.get("fullName") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      skills: String(form.get("skills") || "").trim(),
      growthFocus: String(form.get("growthFocus") || "").trim(),
    });
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
      <div className="modal-head"><div><span className="small-eyebrow">حصر الفريق</span><h2 id="member-modal-title">إضافة عضو جديد</h2></div><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></div>
      <form onSubmit={handleSubmit}>
        <label>الاسم بالكامل<input name="fullName" required minLength={2} placeholder="اكتب الاسم الرباعي" autoFocus /></label>
        <label>رقم الهاتف <span className="field-hint">اختياري</span><input name="phone" placeholder="01xxxxxxxxx" /></label>
        <label>المهارات أو الحاجات اللي بيحبها <span className="field-hint">اختياري</span><input name="skills" placeholder="تصوير، كتابة، تصميم..." /></label>
        <label>التركيز أو الحاجة اللي حابب يطورها <span className="field-hint">اختياري</span><input name="growthFocus" placeholder="مثال: أتعلم المونتاج" /></label>
        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}><Check size={16} /> {saving ? "جاري الحفظ..." : "حفظ العضو"}</button></div>
      </form>
    </div>
  </div>;
}

export { defaultMembers, defaultTasks };

function LoginModal({ onClose, onSubmit, saving, error }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean; error: string }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="login-modal-title"><div className="modal-head"><div><span className="small-eyebrow">دخول المسؤول</span><h2 id="login-modal-title">تسجيل الدخول</h2></div><button className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={19} /></button></div><form onSubmit={onSubmit}><label>الإيميل<input name="email" type="email" required autoComplete="username" dir="ltr" autoFocus /></label><label>كلمة المرور<input name="password" type="password" required autoComplete="current-password" dir="ltr" /></label>{error && <span role="alert" style={{ color: "#c62828", fontSize: 11, fontWeight: 700 }}>{error}</span>}<div className="modal-actions"><button type="button" className="ghost-button" onClick={onClose}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}><Check size={16} /> {saving ? "جاري الدخول..." : "دخول"}</button></div></form></div></div>;
}
