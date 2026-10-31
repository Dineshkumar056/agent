import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Download,
  GraduationCap,
  Layers3,
  LogOut,
  Plus,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getRoleNavItems, roleMeta as appRoleMeta } from './roleConfig';

const STORAGE_KEY = 'studyagent-local-data';
const SESSION_KEY = 'studyagent-session';

const defaultRegister = {
  name: '',
  register_number: '',
  email: '',
  college: 'BluePeak Institute of Technology',
  department: 'Computer Science',
  course: 'B.Tech',
  year: '3',
  semester: '6',
  study_hours_per_day: '3',
  password: '',
};

const scenarioOptions = [
  { value: 'missed-class', label: 'Missed class' },
  { value: 'holiday', label: 'College holiday' },
  { value: 'deadline-change', label: 'Deadline changed' },
  { value: 'exam-postponed', label: 'Examination postponed' },
];

function hashValue(value) {
  if (!value) return '';
  return btoa(value);
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college,
    department: user.department,
    register_number: user.register_number || null,
  };
}

function getSeedState() {
  return {
    users: [
      { id: 1, name: 'Aarav Sharma', email: 'student@college.edu', passwordHash: 'c3R1ZGVudDEyMw==', role: 'student', college: 'BluePeak Institute of Technology', department: 'Computer Science', register_number: 'BT2023001' },
      { id: 2, name: 'Priya Nair', email: 'tech@college.edu', passwordHash: 'dGVjaDEyMw==', role: 'tech', college: 'BluePeak Institute of Technology', department: 'Computer Science', register_number: null },
      { id: 3, name: 'Aditi Rao', email: 'appadmin@college.edu', passwordHash: 'YXBwYWRtaW4xMjM=', role: 'app-admin', college: 'BluePeak Institute of Technology', department: 'Administration', register_number: null },
      { id: 4, name: 'Mohit Verma', email: 'mgmt@college.edu', passwordHash: 'bWdtdDEyMw==', role: 'management', college: 'BluePeak Institute of Technology', department: 'Management', register_number: null },
      { id: 5, name: 'Raghav Kumar', email: 'superadmin@college.edu', passwordHash: 'YWRtaW4xMjM=', role: 'main-admin', college: 'BluePeak Institute of Technology', department: 'System Administration', register_number: null },
    ],
    students: [
      { id: 1, user_id: 1, register_number: 'BT2023001', college: 'BluePeak Institute of Technology', department: 'Computer Science', course: 'B.Tech', year: 3, semester: 6, study_hours_per_day: 3, attendance: 86, internal_marks: 80.4, completed_classes: 24, missed_classes: 3 },
    ],
    assignments: [
      { id: 1, student_id: 1, title: 'AI Project Review', subject: 'Machine Learning', due_date: '2026-11-05', status: 'pending', priority: 'high' },
      { id: 2, student_id: 1, title: 'DBMS Lab Record', subject: 'DBMS', due_date: '2026-11-07', status: 'in-progress', priority: 'medium' },
      { id: 3, student_id: 1, title: 'Seminar Presentation', subject: 'Operating Systems', due_date: '2026-11-10', status: 'pending', priority: 'high' },
    ],
    exams: [
      { id: 1, student_id: 1, title: 'Internal Test 2', subject: 'Algorithms', exam_date: '2026-11-16', type: 'internal', status: 'scheduled' },
      { id: 2, student_id: 1, title: 'Semester Practical', subject: 'Java Lab', exam_date: '2026-11-20', type: 'practical', status: 'scheduled' },
    ],
    timetableEntries: [
      { id: 1, student_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00', subject: 'Algorithms', room: 'A-101', type: 'class' },
      { id: 2, student_id: 1, day: 'Monday', start_time: '10:15', end_time: '11:15', subject: 'DBMS', room: 'B-220', type: 'lab' },
      { id: 3, student_id: 1, day: 'Tuesday', start_time: '11:00', end_time: '12:00', subject: 'Machine Learning', room: 'C-304', type: 'class' },
      { id: 4, student_id: 1, day: 'Wednesday', start_time: '14:00', end_time: '15:00', subject: 'Operating Systems', room: 'A-205', type: 'class' },
    ],
    notifications: [
      { id: 1, user_id: 1, title: 'Deadline Alert', message: 'AI Assignment is due in 3 days. Start revision now.', type: 'deadline' },
      { id: 2, user_id: 1, title: 'Attendance Warning', message: 'Your attendance is at 86%; maintain 85% to avoid issues.', type: 'attendance' },
      { id: 3, user_id: 1, title: 'Holiday Update', message: 'A college holiday has been announced. Your study plan was adjusted automatically.', type: 'alert' },
    ],
    announcements: [
      { id: 1, title: 'Annual Exam Schedule Released', message: 'Final exam timetable is now available in the student portal.', severity: 'info' },
      { id: 2, title: 'Rain Advisory', message: 'Campus is open, but transport services are running with a 30 minute delay.', severity: 'warning' },
      { id: 3, title: 'Holiday Update', message: 'The college remains closed on account of the state holiday announced by the district office.', severity: 'urgent' },
    ],
    settings: [
      { key: 'studyHoursPerDay', value: '3' },
      { key: 'attendanceThreshold', value: '75' },
      { key: 'collegeName', value: 'BluePeak Institute of Technology' },
    ],
  };
}

function readLocalState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const seed = getSeedState();

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    const demoUser = parsed.users?.find((user) => user.email.toLowerCase() === 'student@college.edu');

    if (!demoUser || demoUser.passwordHash !== 'c3R1ZGVudDEyMw==') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function writeLocalState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function getUserFromSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return user || null;
  } catch {
    return null;
  }
}

function setUserInSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function generateAiPlan(student, state, scenario = null) {
  if (!student) {
    return { summary: { attendance: 0, internalMarks: 0, studyHours: 0 }, schedule: [], weeklyPlan: [], recommendations: [], changes: [], explanations: [] };
  }

  const tasks = state.assignments.filter((item) => item.student_id === student.id);
  const weakSubjects = ['Algorithms', 'Machine Learning'];
  const attendanceRisk = Math.max(0, 100 - student.attendance);
  const hours = Number(student.study_hours_per_day || 3);
  const basePlan = [
    { time: '07:00-08:00', subject: 'Algorithms', focus: 'Revision' },
    { time: '08:30-09:30', subject: 'DBMS', focus: 'Practice' },
    { time: '18:00-19:00', subject: 'Machine Learning', focus: 'Concepts' },
    { time: '19:30-20:30', subject: 'Project Work', focus: 'Portfolio' },
  ].slice(0, Math.max(2, hours));

  const changes = [];
  const explanations = [];

  if (scenario === 'holiday') {
    changes.push({ title: 'Holiday adjustment', description: 'Removed class blocks on the announced holiday and shifted revision to free time.' });
    explanations.push('Because the college announced a holiday, the AI moved the affected study blocks into flexible revision slots with no conflicts.');
  }

  if (scenario === 'missed-class') {
    changes.push({ title: 'Missed class recovery', description: 'Added the missed topic to revision and scheduled a catch-up session.' });
    explanations.push('A missed class increases learning gaps, so the system inserted a revision block for the missed topic before the next assessment.');
  }

  if (scenario === 'deadline-change') {
    changes.push({ title: 'Deadline updated', description: 'Reordered the task queue and moved the assignment revision to the earliest available slot.' });
    explanations.push('The deadline moved earlier, so the AI prioritised the affected task to reduce risk and avoid overload.');
  }

  if (scenario === 'exam-postponed') {
    changes.push({ title: 'Examination moved', description: 'Rescheduled the preparation load to protect workload balance and maintain realistic revision windows.' });
    explanations.push('A postponed exam reduced the near-term urgency, so the planner preserved revision coverage without crowding the next week.');
  }

  if (attendanceRisk > 20) {
    changes.push({ title: 'Attendance recovery plan', description: `Attendance is ${student.attendance}% and needs extra revision focus.` });
    explanations.push('Low attendance reduces coverage confidence, so the planner adds additional recap time for the weak subjects.');
  }

  if (!changes.length) {
    changes.push({ title: 'Stable plan', description: 'No major adjustment required. Current schedule remains balanced and realistic.' });
    explanations.push('The planner checked deadlines, workload, and timetable conflicts and found the current distribution acceptable.');
  }

  return {
    summary: {
      studentName: state.users.find((u) => u.id === student.user_id)?.name || 'Student',
      attendance: student.attendance,
      internalMarks: student.internal_marks ?? student.internalMarks ?? 80,
      examCount: state.exams.filter((item) => item.student_id === student.id).length,
      weakSubjects,
      studyHours: hours,
      priority: attendanceRisk > 20 ? 'High' : 'Balanced',
      tasksPending: tasks.length,
    },
    schedule: basePlan,
    weeklyPlan: [
      { day: 'Monday', subject: 'Algorithms', hours: 1.5, task: 'Solve previous questions' },
      { day: 'Tuesday', subject: 'DBMS', hours: 1.5, task: 'Lab exercise & revision' },
      { day: 'Wednesday', subject: 'Machine Learning', hours: 2, task: 'Model review & projects' },
      { day: 'Thursday', subject: 'Operating Systems', hours: 1.5, task: 'Quiz prep' },
      { day: 'Friday', subject: 'Project Work', hours: 2, task: 'Major project sprint' },
    ],
    recommendations: [
      'Prioritise weak subjects before each internal assessment.',
      'Protect revision windows before tests and practicals.',
      'Keep a short recap block after every class to reduce backlogs.',
    ],
    changes,
    explanations,
  };
}

function formatRoleLabel(role) {
  return appRoleMeta[role]?.title || 'User';
}

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <small>{label}</small>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function App() {
  const [activeRole, setActiveRole] = useState('student');
  const [authView, setAuthView] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: appRoleMeta.student.email, password: appRoleMeta.student.password, role: 'student' });
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [state, setState] = useState(() => readLocalState());
  const [user, setUser] = useState(() => getUserFromSession());
  const [activePage, setActivePage] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: 'info', message: 'Your academic dashboard is ready.' });
  const [whatIfType, setWhatIfType] = useState('missed-class');
  const [plan, setPlan] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', subject: '', due_date: '', status: 'pending', priority: 'medium' });
  const [techSettings, setTechSettings] = useState([
    { id: 1, name: 'Attendance API', value: 'Active', description: 'Sync status for attendance updates' },
    { id: 2, name: 'Timetable sync', value: 'Online', description: 'Daily timetable refresh status' },
    { id: 3, name: 'Student import', value: 'Ready', description: 'Bulk import workflow for new enrollments' },
  ]);
  const [studentRecords, setStudentRecords] = useState([
    { id: 1, name: 'Aarav Sharma', department: 'Computer Science', status: 'Verified' },
    { id: 2, name: 'Meera Iyer', department: 'Electronics', status: 'Pending' },
    { id: 3, name: 'Karan Singh', department: 'Mechanical', status: 'Reviewed' },
  ]);
  const [adminApprovals, setAdminApprovals] = useState([
    { id: 1, title: 'Exam room request', status: 'Approved' },
    { id: 2, title: 'Holiday schedule update', status: 'Pending' },
    { id: 3, title: 'Faculty assignment review', status: 'In review' },
  ]);

  const currentStudent = useMemo(() => {
    if (!user) return null;
    return state.students.find((item) => item.user_id === user.id) || null;
  }, [state, user]);

  const tasks = useMemo(() => {
    if (!currentStudent) {
      if (user?.role === 'student') return state.assignments.filter((item) => item.student_id === 1);
      return state.assignments.slice(0, 4);
    }
    return state.assignments.filter((item) => item.student_id === currentStudent.id);
  }, [state, currentStudent, user]);

  const notifications = useMemo(() => {
    if (!user) return [];
    return state.notifications.filter((item) => item.user_id === user.id || user.role !== 'student');
  }, [state, user]);

  const announcements = state.announcements || [];

  useEffect(() => {
    setUserInSession(user);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const student = currentStudent || state.students[0];
    if (student) {
      setPlan(generateAiPlan(student, state, null));
    }
  }, [user, currentStudent, state]);

  const handleLogin = (event) => {
    event.preventDefault();
    setLoading(true);

    const trimmedEmail = loginForm.email.trim();
    const record = state.users.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase() && (!loginForm.role || u.role === loginForm.role));

    if (!record) {
      setNotice({ type: 'error', message: 'No matching user with that role was found.' });
      setLoading(false);
      return;
    }

    if (record.passwordHash !== hashValue(loginForm.password)) {
      setNotice({ type: 'error', message: 'Incorrect password. Please use the demo password for that role.' });
      setLoading(false);
      return;
    }

    const normalized = normalizeUser(record);
    setUser(normalized);
    setNotice({ type: 'success', message: `Welcome back, ${normalized.name}.` });
    setLoading(false);
  };

  const handleRegister = (event) => {
    event.preventDefault();
    const student = { ...registerForm, name: registerForm.name.trim(), email: registerForm.email.trim() };
    if (!student.name || !student.register_number || !student.email || !student.password) {
      setNotice({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    const nextState = { ...state };
    if (nextState.users.some((userItem) => userItem.email.toLowerCase() === student.email.toLowerCase())) {
      setNotice({ type: 'error', message: 'An account with that email already exists.' });
      return;
    }

    const nextUserId = (nextState.users.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    const nextStudentId = (nextState.students.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;

    nextState.users.push({
      id: nextUserId,
      name: student.name,
      email: student.email,
      passwordHash: hashValue(student.password),
      role: 'student',
      college: student.college,
      department: student.department,
      register_number: student.register_number,
    });

    nextState.students.push({
      id: nextStudentId,
      user_id: nextUserId,
      register_number: student.register_number,
      college: student.college,
      department: student.department,
      course: student.course,
      year: Number(student.year),
      semester: Number(student.semester),
      study_hours_per_day: Number(student.study_hours_per_day || 3),
      attendance: 86,
      internal_marks: 80,
      completed_classes: 0,
      missed_classes: 0,
    });

    nextState.notifications.unshift({
      id: Date.now(),
      user_id: nextUserId,
      title: 'Welcome to StudyAgent',
      message: 'Your account has been created and AI planning is ready.',
      type: 'welcome',
    });

    writeLocalState(nextState);
    setState(nextState);
    setNotice({ type: 'success', message: 'Student registration successful. You can now log in.' });
    setAuthView('login');
    setRegisterForm(defaultRegister);
    setLoginForm({ email: student.email, password: student.password, role: 'student' });
  };

  const handleForgotPassword = () => {
    setNotice({ type: 'success', message: `A password reset link was prepared for ${loginForm.email || 'your account'}. Demo mode: use the default role password.` });
  };

  const handleLogout = () => {
    setUser(null);
    setNotice({ type: 'info', message: 'You have been signed out.' });
  };

  const handleWhatIf = () => {
    if (!currentStudent) return;
    const nextPlan = generateAiPlan(currentStudent, state, whatIfType);
    setPlan(nextPlan);
    setNotice({ type: 'success', message: 'What-if scenario updated the study plan.' });
  };

  const handleExport = () => {
    const csv = [
      ['Title', 'Subject', 'Due Date', 'Status', 'Priority'],
      ...tasks.map((task) => [task.title, task.subject, task.due_date, task.status, task.priority]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'studyagent-report.csv';
    link.click();
  };

  const handlePrint = () => window.print();

  const handleAddTask = (event) => {
    event.preventDefault();
    if (!taskForm.title || !taskForm.subject || !taskForm.due_date) {
      setNotice({ type: 'error', message: 'Please complete task title, subject, and due date.' });
      return;
    }

    const nextTask = {
      id: Date.now(),
      student_id: currentStudent ? currentStudent.id : 1,
      title: taskForm.title,
      subject: taskForm.subject,
      due_date: taskForm.due_date,
      status: taskForm.status,
      priority: taskForm.priority,
    };

    const nextState = {
      ...state,
      assignments: [nextTask, ...state.assignments],
    };
    writeLocalState(nextState);
    setState(nextState);
    setTaskForm({ title: '', subject: '', due_date: '', status: 'pending', priority: 'medium' });
    setShowTaskForm(false);
    setNotice({ type: 'success', message: 'Academic task added successfully.' });
  };

  const handleTechSettingChange = (id, value) => {
    setTechSettings((current) => current.map((item) => item.id === id ? { ...item, value } : item));
  };

  const handleStudentRecordChange = (id, field, value) => {
    setStudentRecords((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleApprovalChange = (id, value) => {
    setAdminApprovals((current) => current.map((item) => item.id === id ? { ...item, status: value } : item));
  };

  const baseMetrics = {
    student: {
      label: 'Attendance', value: `${currentStudent?.attendance || 86}%`, secondary: 'AI study hours', secondaryValue: `${currentStudent?.study_hours_per_day || 3} hrs/day` },
    tech: {
      label: 'Faculty coverage', value: '94%', secondary: 'Classes monitored', secondaryValue: '68' },
    'app-admin': {
      label: 'Department health', value: '88%', secondary: 'Pending approvals', secondaryValue: '12' },
    management: {
      label: 'Campus score', value: '91%', secondary: 'Institution alerts', secondaryValue: '7' },
    'main-admin': {
      label: 'System uptime', value: '99.8%', secondary: 'Audit logs', secondaryValue: '24' },
  };

  const chartData = [
    { name: 'Mon', value: Math.min(100, (currentStudent?.attendance || 86) - 2) },
    { name: 'Tue', value: Math.min(100, (currentStudent?.attendance || 86) + 1) },
    { name: 'Wed', value: Math.min(100, (currentStudent?.attendance || 86) - 6) },
    { name: 'Thu', value: Math.min(100, (currentStudent?.attendance || 86) + 4) },
    { name: 'Fri', value: Math.min(100, (currentStudent?.attendance || 86) + 3) },
    { name: 'Sat', value: Math.min(100, (currentStudent?.attendance || 86) + 2) },
  ];

  if (!user) {
    return (
      <div className="app-shell auth-shell">
        <div className="auth-panel left-panel">
          <div className="brand-wrap">
            <div className="brand-badge">SA</div>
            <div>
              <p className="eyebrow">Academic Intelligence</p>
              <h1>StudyAgent</h1>
            </div>
          </div>

          <div className="promo-card">
            <p className="section-tag">Adaptive academic planning</p>
            <h2>AI-powered college scheduling for smarter academic performance.</h2>
            <ul>
              <li>Real-time attendance, assignment, and exam-aware planning</li>
              <li>Academic rescheduling during holidays, emergencies, and timetable changes</li>
              <li>Role-based access for every stakeholder in the institution</li>
            </ul>
          </div>

          <div className="demo-grid">
            {Object.entries(appRoleMeta).map(([role, info]) => (
              <button
                key={role}
                type="button"
                className={`demo-role ${activeRole === role ? 'selected' : ''}`}
                onClick={() => {
                  setActiveRole(role);
                  setLoginForm({ email: info.email, password: info.password, role });
                }}
              >
                <span>{info.title}</span>
                <small>{info.email}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-panel right-panel">
          <div className="auth-header">
            <div>
              <p className="eyebrow">Secure portal</p>
              <h2>{authView === 'login' ? 'Welcome back' : 'Student registration'}</h2>
            </div>
          </div>

          {notice.message ? <div className={`alert ${notice.type}`}>{notice.message}</div> : null}

          {authView === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Role
                <select
                  value={loginForm.role}
                  onChange={(event) => {
                    const nextRole = event.target.value;
                    setActiveRole(nextRole);
                    setLoginForm((current) => ({
                      ...current,
                      role: nextRole,
                      email: appRoleMeta[nextRole].email,
                      password: appRoleMeta[nextRole].password,
                    }));
                  }}
                >
                  {Object.entries(appRoleMeta).map(([role, info]) => (
                    <option key={role} value={role}>{info.title}</option>
                  ))}
                </select>
              </label>

              <label>
                Email
                <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@college.edu" />
              </label>

              <label>
                Password
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} placeholder="Enter password" />
              </label>

              <div className="form-actions stacked">
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
                <button className="secondary-button" type="button" onClick={handleForgotPassword}>Forgot password</button>
              </div>

              <p className="switch-link">
                New student? <button type="button" className="link-button" onClick={() => setAuthView('register')}>Register here</button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-grid double">
                <label>
                  Student name
                  <input value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} />
                </label>
                <label>
                  Register number
                  <input value={registerForm.register_number} onChange={(event) => setRegisterForm({ ...registerForm, register_number: event.target.value })} />
                </label>
              </div>

              <div className="form-grid double">
                <label>
                  Email
                  <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
                </label>
                <label>
                  Password
                  <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
                </label>
              </div>

              <div className="form-grid double">
                <label>
                  College
                  <input value={registerForm.college} onChange={(event) => setRegisterForm({ ...registerForm, college: event.target.value })} />
                </label>
                <label>
                  Department
                  <input value={registerForm.department} onChange={(event) => setRegisterForm({ ...registerForm, department: event.target.value })} />
                </label>
              </div>

              <div className="form-grid double">
                <label>
                  Course
                  <input value={registerForm.course} onChange={(event) => setRegisterForm({ ...registerForm, course: event.target.value })} />
                </label>
                <label>
                  Year
                  <input value={registerForm.year} onChange={(event) => setRegisterForm({ ...registerForm, year: event.target.value })} />
                </label>
              </div>

              <div className="form-grid double">
                <label>
                  Semester
                  <input value={registerForm.semester} onChange={(event) => setRegisterForm({ ...registerForm, semester: event.target.value })} />
                </label>
                <label>
                  Daily study hours
                  <input value={registerForm.study_hours_per_day} onChange={(event) => setRegisterForm({ ...registerForm, study_hours_per_day: event.target.value })} />
                </label>
              </div>

              <div className="form-actions stacked">
                <button className="primary-button" type="submit">Create student account</button>
                <button className="secondary-button" type="button" onClick={() => setAuthView('login')}>Back to login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const renderRoleDetails = () => {
    switch (user.role) {
      case 'tech':
        return (
          <>
            <section className="summary-grid">
              <StatCard icon={GraduationCap} label="Faculty coverage" value="94%" tone="blue" />
              <StatCard icon={ClipboardCheck} label="Attendance updates" value="68" tone="purple" />
              <StatCard icon={BookOpen} label="Subjects managed" value="18" tone="green" />
              <StatCard icon={Bell} label="Alerts" value="5" tone="amber" />
            </section>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Faculty</p><h3>Academic oversight</h3></div></div>
                <div className="stacked-list">
                  {['CS301 Algorithms', 'CS302 DBMS', 'CS303 ML', 'EC304 Signals'].map((subject, index) => (
                    <div key={index} className="list-item"><div className="list-icon"><BookOpen size={15} /></div><div><strong>{subject}</strong><small>Faculty update pending approval</small></div></div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Timetable</p><h3>Schedule checks</h3></div></div>
                <div className="stacked-list">
                  {['Monday lab rotation approved', 'Wednesday seminar chair assigned', 'Friday holiday notice synced'].map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon warning"><CalendarClock size={15} /></div><div><strong>Update</strong><small>{item}</small></div></div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
      case 'app-admin':
        return (
          <>
            <section className="summary-grid">
              <StatCard icon={GraduationCap} label="Student records" value="312" tone="blue" />
              <StatCard icon={ClipboardCheck} label="Pending reviews" value="18" tone="purple" />
              <StatCard icon={BookOpen} label="Departments" value="08" tone="green" />
              <StatCard icon={Bell} label="Events" value="11" tone="amber" />
            </section>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Operations</p><h3>Department summary</h3></div></div>
                <div className="stacked-list">
                  {['Computer Science', 'Electronics', 'Mechanical', 'Civil'].map((dept, index) => (
                    <div key={index} className="list-item"><div className="list-icon"><Activity size={15} /></div><div><strong>{dept}</strong><small>Academic updates available</small></div></div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Task queue</p><h3>Approvals</h3></div></div>
                <div className="stacked-list">
                  {['Exam room update', 'Timetable changes', 'Faculty assignment', 'Holiday notice'].map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon warning"><Sparkles size={15} /></div><div><strong>Review</strong><small>{item}</small></div></div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
      case 'management':
        return (
          <>
            <section className="summary-grid">
              <StatCard icon={GraduationCap} label="College score" value="91%" tone="blue" />
              <StatCard icon={ClipboardCheck} label="Departments" value="8" tone="purple" />
              <StatCard icon={BookOpen} label="Attendance" value="85%" tone="green" />
              <StatCard icon={Bell} label="Announcements" value="7" tone="amber" />
            </section>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Report</p><h3>Institution trend</h3></div></div>
                <div className="bar-chart-wrap">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[{ name: 'CS', value: 90 }, { name: 'EC', value: 82 }, { name: 'ME', value: 88 }, { name: 'CE', value: 84 }]}>
                      <CartesianGrid stroke="#e8effd" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a8bb6" />
                      <YAxis stroke="#7a8bb6" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">College notices</p><h3>Board updates</h3></div></div>
                <div className="stacked-list">
                  {announcements.map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon"><Bell size={15} /></div><div><strong>{item.title}</strong><small>{item.message}</small></div></div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
      case 'main-admin':
        return (
          <>
            <section className="summary-grid">
              <StatCard icon={GraduationCap} label="System uptime" value="99.8%" tone="blue" />
              <StatCard icon={ClipboardCheck} label="Roles" value="5" tone="purple" />
              <StatCard icon={BookOpen} label="Audit entries" value="224" tone="green" />
              <StatCard icon={Bell} label="Backups" value="7" tone="amber" />
            </section>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Admin</p><h3>System controls</h3></div></div>
                <div className="stacked-list">
                  {['Users & permissions', 'College settings', 'Database backup', 'Audit logs', 'API configuration'].map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon"><Sparkles size={15} /></div><div><strong>{item}</strong><small>Ready for supervision</small></div></div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div><p className="eyebrow">Audit</p><h3>Recent activity</h3></div></div>
                <div className="stacked-list">
                  {['Student login verified', 'Faculty schedule approved', 'Holiday alert distributed', 'Backup created successfully'].map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon warning"><Activity size={15} /></div><div><strong>Event</strong><small>{item}</small></div></div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
      default:
        return (
          <>
            <section className="summary-grid">
              <StatCard icon={GraduationCap} label="Attendance" value={`${currentStudent?.attendance || 86}%`} tone="blue" />
              <StatCard icon={ClipboardCheck} label="Pending tasks" value={String(tasks.length || 3)} tone="purple" />
              <StatCard icon={BookOpen} label="AI study hours" value={`${currentStudent?.study_hours_per_day || 3} hrs/day`} tone="green" />
              <StatCard icon={Bell} label="Alerts" value={String(notifications.length || 3)} tone="amber" />
            </section>
            <section className="content-grid">
              <div className="panel wide">
                <div className="panel-header"><div><p className="eyebrow">Academic overview</p><h3>{user.name}</h3></div><div className="muted-tags"><span>{user.college}</span><span>{user.department}</span></div></div>
                <div className="hero-metrics">
                  <div><small>Internal marks</small><strong>{currentStudent?.internal_marks || 80.4}%</strong></div>
                  <div><small>Upcoming exams</small><strong>{plan?.summary?.examCount || 2}</strong></div>
                  <div><small>Priority</small><strong>{plan?.summary?.priority || 'Balanced'}</strong></div>
                </div>
                <div className="chart-card">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="areaBlue" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#3265ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3265ff" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e8effd" />
                      <XAxis dataKey="name" stroke="#7a8bb6" />
                      <YAxis stroke="#7a8bb6" />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#3265ff" fill="url(#areaBlue)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel compact-panel">
                <div className="panel-header"><div><p className="eyebrow">Notifications</p><h3>Alerts</h3></div></div>
                <div className="stacked-list">
                  {(notifications.length ? notifications : [{ title: 'Daily update', message: 'No new notifications' }]).map((item, index) => (
                    <div key={index} className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>{item.title}</strong><small>{item.message}</small></div></div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );
    }
  };

  const navItems = getRoleNavItems(user?.role || 'student').map((item) => ({
    ...item,
    icon:
      item.key === 'overview' ? <Layers3 size={18} /> :
      item.key === 'attendance' ? <Activity size={18} /> :
      item.key === 'timetable' ? <CalendarClock size={18} /> :
      item.key === 'assignments' ? <ClipboardCheck size={18} /> :
      item.key === 'ai-planner' ? <Sparkles size={18} /> :
      item.key === 'system-health' ? <Activity size={18} /> :
      item.key === 'integrations' ? <Layers3 size={18} /> :
      item.key === 'security' ? <Bell size={18} /> :
      item.key === 'reports' ? <FileText size={18} /> :
      item.key === 'students' ? <GraduationCap size={18} /> :
      item.key === 'approvals' ? <ClipboardCheck size={18} /> :
      item.key === 'departments' ? <BookOpen size={18} /> :
      item.key === 'alerts' ? <Bell size={18} /> :
      item.key === 'performance' ? <Activity size={18} /> :
      item.key === 'compliance' ? <ClipboardCheck size={18} /> :
      item.key === 'users' ? <GraduationCap size={18} /> :
      item.key === 'systems' ? <Layers3 size={18} /> :
      <Sparkles size={18} />,
  }));

  const renderOverviewPage = () => {
    if (user?.role === 'student') {
      return (
        <>
          <section className="summary-grid">
            <StatCard icon={GraduationCap} label="Attendance" value={`${currentStudent?.attendance || 86}%`} tone="blue" />
            <StatCard icon={ClipboardCheck} label="Pending tasks" value={String(tasks.length || 3)} tone="purple" />
            <StatCard icon={BookOpen} label="AI study hours" value={`${currentStudent?.study_hours_per_day || 3} hrs/day`} tone="green" />
            <StatCard icon={Bell} label="Alerts" value={String(notifications.length || 3)} tone="amber" />
          </section>

          <section className="content-grid">
            <div className="panel wide">
              <div className="panel-header"><div><p className="eyebrow">Academic overview</p><h3>{user.name}</h3></div><div className="muted-tags"><span>{user.college}</span><span>{user.department}</span></div></div>
              <div className="hero-metrics">
                <div><small>Internal marks</small><strong>{currentStudent?.internal_marks || 80.4}%</strong></div>
                <div><small>Upcoming exams</small><strong>{plan?.summary?.examCount || 2}</strong></div>
                <div><small>Priority</small><strong>{plan?.summary?.priority || 'Balanced'}</strong></div>
              </div>
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="areaBlue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#3265ff" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3265ff" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e8effd" />
                    <XAxis dataKey="name" stroke="#7a8bb6" />
                    <YAxis stroke="#7a8bb6" />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3265ff" fill="url(#areaBlue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel compact-panel">
              <div className="panel-header"><div><p className="eyebrow">Notifications</p><h3>Alerts</h3></div></div>
              <div className="stacked-list">
                {(notifications.length ? notifications : [{ title: 'Daily update', message: 'No new notifications' }]).map((item, index) => (
                  <div key={index} className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>{item.title}</strong><small>{item.message}</small></div></div>
                ))}
              </div>
            </div>
          </section>
        </>
      );
    }

    return renderRoleDetails();
  };

  const renderAttendancePage = () => (
    <>
      <section className="summary-grid">
        <StatCard icon={GraduationCap} label="Attendance" value={`${currentStudent?.attendance || 86}%`} tone="blue" />
        <StatCard icon={ClipboardCheck} label="Classes attended" value={String(currentStudent?.completed_classes || 24)} tone="purple" />
        <StatCard icon={BookOpen} label="Study hours" value={`${currentStudent?.study_hours_per_day || 3} hrs/day`} tone="green" />
        <StatCard icon={Bell} label="Alerts" value={String(notifications.length || 3)} tone="amber" />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header"><div><p className="eyebrow">Attendance</p><h3>Performance trend</h3></div></div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="attendanceArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#3265ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3265ff" stopOpacity={0.12} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8effd" />
                <XAxis dataKey="name" stroke="#7a8bb6" />
                <YAxis stroke="#7a8bb6" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3265ff" fill="url(#attendanceArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div><p className="eyebrow">Metrics</p><h3>Class summary</h3></div></div>
          <div className="stacked-list">
            <div className="list-item"><div className="list-icon"><Activity size={15} /></div><div><strong>Classes completed</strong><small>{currentStudent?.completed_classes || 24} sessions this month</small></div></div>
            <div className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>Classes missed</strong><small>{currentStudent?.missed_classes || 3} sessions need recovery</small></div></div>
            <div className="list-item"><div className="list-icon"><BookOpen size={15} /></div><div><strong>Target threshold</strong><small>Maintain at least 85% attendance</small></div></div>
          </div>
        </div>
      </section>
    </>
  );

  const renderTimetablePage = () => (
    <>
      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header"><div><p className="eyebrow">Timetable</p><h3>Weekly academic schedule</h3></div></div>
          <div className="stacked-list">
            {(state.timetableEntries || []).map((entry) => (
              <div className="list-item" key={entry.id}>
                <div className="list-icon"><CalendarClock size={15} /></div>
                <div style={{ flex: 1 }}>
                  <strong>{entry.day} • {entry.subject}</strong>
                  <small>{entry.start_time} - {entry.end_time} • {entry.room} • {entry.type}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div><p className="eyebrow">Focus</p><h3>Priority slots</h3></div></div>
          <div className="stacked-list">
            {['Algorithms revision', 'DBMS lab practice', 'ML concept session', 'Operating systems recap'].map((slot, index) => (
              <div className="list-item" key={index}><div className="list-icon warning"><Sparkles size={15} /></div><div><strong>Priority {index + 1}</strong><small>{slot}</small></div></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderAssignmentsPage = () => (
    <>
      <section className="panel">
        <div className="panel-header">
          <div><p className="eyebrow">Assignments</p><h3>Task management</h3></div>
          <button className="ghost-button" type="button" onClick={() => setShowTaskForm((current) => !current)}><Plus size={14} /> Add task</button>
        </div>

        {showTaskForm ? (
          <form className="task-form" onSubmit={handleAddTask}>
            <div className="form-grid double">
              <label>Title<input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label>
              <label>Subject<input value={taskForm.subject} onChange={(event) => setTaskForm({ ...taskForm, subject: event.target.value })} /></label>
            </div>
            <div className="form-grid double">
              <label>Due date<input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} /></label>
              <label>Status<select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}><option value="pending">pending</option><option value="in-progress">in-progress</option><option value="completed">completed</option></select></label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-button">Save task</button>
              <button type="button" className="secondary-button" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        ) : null}

        <div className="task-list" style={{ marginTop: showTaskForm ? 18 : 0 }}>
          {tasks.map((task) => (
            <div className="task-item" key={task.id}>
              <div><strong>{task.title}</strong><small>{task.subject}</small></div>
              <div className="task-meta"><span className={`status-pill ${task.status}`}>{task.status}</span><span>{task.due_date}</span></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderAiPlannerPage = () => (
    <>
      <section className="content-grid">
        <div className="panel">
          <div className="panel-header"><div><p className="eyebrow">AI study planner</p><h3>Adaptive schedule</h3></div></div>
          <div className="what-if-box">
            <select value={whatIfType} onChange={(event) => setWhatIfType(event.target.value)}>
              {scenarioOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <button type="button" className="primary-button" onClick={handleWhatIf}>Run simulation</button>
          </div>
          {(plan?.schedule || []).slice(0, 4).map((slot, index) => (
            <div key={index} className="schedule-row">
              <div className="slot-time">{slot.time}</div>
              <div><strong>{slot.subject}</strong><small>{slot.focus}</small></div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header"><div><p className="eyebrow">Performance</p><h3>Academic progress</h3></div></div>
          <div className="bar-chart-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[{ name: 'Algorithms', value: 78 }, { name: 'DBMS', value: 84 }, { name: 'ML', value: 72 }, { name: 'OS', value: 88 }]}>
                <CartesianGrid stroke="#e8effd" vertical={false} />
                <XAxis dataKey="name" stroke="#7a8bb6" />
                <YAxis stroke="#7a8bb6" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel ai-panel">
        <div className="panel-header"><div><p className="eyebrow">AI decision trace</p><h3>Rescheduling reasoning</h3></div></div>
        <div className="ai-grid">
          <div className="ai-card"><h4>Summary</h4><p>{plan?.summary?.studentName || user.name}</p><ul><li>Attendance: {plan?.summary?.attendance || 86}%</li><li>Internal marks: {plan?.summary?.internalMarks || 80.4}%</li><li>Study hours: {plan?.summary?.studyHours || 3} hrs/day</li></ul></div>
          <div className="ai-card"><h4>Changes made</h4><ul>{(plan?.changes || [{ title: 'No major changes', description: 'Current schedule remains stable.' }]).map((change, index) => (<li key={index}><strong>{change.title}:</strong> {change.description}</li>))}</ul></div>
          <div className="ai-card"><h4>Explanations</h4><ul>{(plan?.explanations || ['The planner checked workload, deadlines, and conflicts and kept the schedule balanced.']).map((text, index) => (<li key={index}>{text}</li>))}</ul></div>
        </div>
      </section>
    </>
  );

  const renderRoleAccessPage = () => {
    const techPages = {
      overview: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Tech overview</p><h3>System integrity</h3></div></div>
            <div className="stacked-list">
              {['API health okay', 'Attendance sync stable', 'Exam data relay active', 'Backup policy current'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Activity size={15} /></div><div><strong>{item}</strong><small>Technical access is synchronized and active.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      'system-health': (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">System health</p><h3>Core services</h3></div></div>
            <div className="stacked-list">
              {['Authentication service: stable', 'Student portal latency: low', 'Database backup: current', 'Error logs: no critical events'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Activity size={15} /></div><div><strong>Monitoring</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      integrations: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Integrations</p><h3>Connected services</h3></div></div>
            <div className="stacked-list">
              {['Attendance API', 'Timetable sync', 'Student import workflow', 'Notification service'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Layers3 size={15} /></div><div><strong>{item}</strong><small>Connected and running without errors.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      security: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Security</p><h3>Access controls</h3></div></div>
            <div className="stacked-list">
              {['Password policy active', 'Session timeout enabled', 'Multi-role access filtered', 'Suspicious login checks enabled'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>Security check</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      reports: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Reports</p><h3>Operational summary</h3></div></div>
            <div className="bar-chart-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ name: 'API', value: 96 }, { name: 'Auth', value: 94 }, { name: 'Sync', value: 93 }, { name: 'Backup', value: 98 }]}>
                  <CartesianGrid stroke="#e8effd" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a8bb6" />
                  <YAxis stroke="#7a8bb6" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )
    };

    const appAdminPages = {
      overview: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">App admin</p><h3>Student operations</h3></div></div>
            <div className="stacked-list">
              {['Student records reviewed', 'Department approvals scheduled', 'Campus notices routed', 'Weekly academic sync completed'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><GraduationCap size={15} /></div><div><strong>{item}</strong><small>Action completed by the app admin team.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      students: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Students</p><h3>Student management</h3></div></div>
            <div className="stacked-list">
              {['312 students tracked', '24 records needing approval', '5 new admissions pending review', '12 notices distributed'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><GraduationCap size={15} /></div><div><strong>{item}</strong><small>Student data remains current and verified.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      approvals: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Approvals</p><h3>Pending review queue</h3></div></div>
            <div className="stacked-list">
              {['Timetable update approval', 'Exam room request', 'Faculty assignment review', 'Holiday notice authorization'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><ClipboardCheck size={15} /></div><div><strong>{item}</strong><small>Queued for app admin review.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      departments: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Departments</p><h3>Academic units</h3></div></div>
            <div className="stacked-list">
              {['Computer Science', 'Electronics', 'Mechanical', 'Civil'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><BookOpen size={15} /></div><div><strong>{item}</strong><small>Department updates are synchronized.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      alerts: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Alerts</p><h3>Operational alerts</h3></div></div>
            <div className="stacked-list">
              {['Late attendance report', 'Faculty update pending', 'Holiday notice delivered', 'New student onboarding queue'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>{item}</strong><small>Notification reviewed and assigned.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      )
    };

    const managementPages = {
      overview: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Management</p><h3>Institution performance</h3></div></div>
            <div className="bar-chart-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ name: 'CS', value: 92 }, { name: 'EC', value: 84 }, { name: 'ME', value: 87 }, { name: 'CE', value: 89 }]}>
                  <CartesianGrid stroke="#e8effd" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a8bb6" />
                  <YAxis stroke="#7a8bb6" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ),
      performance: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Performance</p><h3>Campus metrics</h3></div></div>
            <div className="stacked-list">
              {['College score: 91%', 'Attendance ratio: 85%', 'Student pass rate: 88%', 'Faculty engagement: 90%'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Activity size={15} /></div><div><strong>Metric</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      approvals: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Approvals</p><h3>Institutional decisions</h3></div></div>
            <div className="stacked-list">
              {['Academic calendar approvals', 'Department budget review', 'Scholarship sanction list', 'Holiday policy signoff'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><ClipboardCheck size={15} /></div><div><strong>{item}</strong><small>Queued for management approval.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      compliance: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Compliance</p><h3>Policy tracking</h3></div></div>
            <div className="stacked-list">
              {['Attendance policy checked', 'Academic quality audit passed', 'Safety briefing complete', 'Student welfare review completed'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><BookOpen size={15} /></div><div><strong>Compliance</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      reports: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Reports</p><h3>Management reporting</h3></div></div>
            <div className="stacked-list">
              {['Monthly academic report generated', 'Department summary prepared', 'Attendance report reviewed', 'Board notice circulated'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><FileText size={15} /></div><div><strong>Report</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      )
    };

    const mainAdminPages = {
      overview: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Main admin</p><h3>Platform controls</h3></div></div>
            <div className="stacked-list">
              {['Role assignments verified', 'Security settings reviewed', 'Backup rotation confirmed', 'System-wide audit log synced'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Sparkles size={15} /></div><div><strong>{item}</strong><small>Main system oversight completed.</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      users: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Users</p><h3>User administration</h3></div></div>
            <div className="stacked-list">
              {['5 role groups active', '312 student accounts active', '8 institutional staff accounts', '2 pending access reviews'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><GraduationCap size={15} /></div><div><strong>Access</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      security: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Security</p><h3>Administrative security</h3></div></div>
            <div className="stacked-list">
              {['Password policy enforced', 'Session lockdown rules active', 'Access logs checked', 'Backup integrity verified'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon warning"><Bell size={15} /></div><div><strong>Security</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      systems: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Systems</p><h3>Platform systems</h3></div></div>
            <div className="stacked-list">
              {['Authentication cluster healthy', 'Notice system online', 'Data sync active', 'Academic planning engine normal'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Layers3 size={15} /></div><div><strong>System</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      ),
      settings: (
        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header"><div><p className="eyebrow">Settings</p><h3>System configuration</h3></div></div>
            <div className="stacked-list">
              {['Academic policy updated', 'Campus theme synced', 'Role permissions reviewed', 'Notification defaults configured'].map((item, index) => (
                <div key={index} className="list-item"><div className="list-icon"><Sparkles size={15} /></div><div><strong>Configuration</strong><small>{item}</small></div></div>
              ))}
            </div>
          </div>
        </section>
      )
    };

    if (user?.role === 'tech') {
      if (activePage === 'system-health') {
        return (
          <section className="content-grid">
            <div className="panel wide">
              <div className="panel-header"><div><p className="eyebrow">System health</p><h3>Edit technical settings</h3></div></div>
              <div className="stacked-list">
                {techSettings.map((item) => (
                  <div className="list-item" key={item.id}>
                    <div style={{ flex: 1 }}>
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </div>
                    <select value={item.value} onChange={(event) => handleTechSettingChange(item.id, event.target.value)} style={{ minWidth: 120 }}>
                      {['Active', 'Online', 'Ready', 'Paused', 'Maintenance'].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="primary-button" onClick={() => setNotice({ type: 'success', message: 'Technical settings updated successfully.' })}>Save changes</button>
              </div>
            </div>
          </section>
        );
      }

      return techPages[activePage] || techPages.overview;
    }

    if (user?.role === 'app-admin') {
      if (activePage === 'students') {
        return (
          <section className="content-grid">
            <div className="panel wide">
              <div className="panel-header"><div><p className="eyebrow">Students</p><h3>Edit student records</h3></div></div>
              <div className="stacked-list">
                {studentRecords.map((student) => (
                  <div className="list-item" key={student.id}>
                    <div style={{ flex: 1 }}>
                      <strong>{student.name}</strong>
                      <small>{student.department}</small>
                    </div>
                    <select value={student.status} onChange={(event) => handleStudentRecordChange(student.id, 'status', event.target.value)} style={{ minWidth: 120 }}>
                      {['Verified', 'Pending', 'Reviewed', 'Flagged'].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="primary-button" onClick={() => setNotice({ type: 'success', message: 'Student record updates saved.' })}>Save records</button>
              </div>
            </div>
          </section>
        );
      }

      if (activePage === 'approvals') {
        return (
          <section className="content-grid">
            <div className="panel wide">
              <div className="panel-header"><div><p className="eyebrow">Approvals</p><h3>Approve queue</h3></div></div>
              <div className="stacked-list">
                {adminApprovals.map((item) => (
                  <div className="list-item" key={item.id}>
                    <div style={{ flex: 1 }}>
                      <strong>{item.title}</strong>
                    </div>
                    <select value={item.status} onChange={(event) => handleApprovalChange(item.id, event.target.value)} style={{ minWidth: 120 }}>
                      {['Approved', 'Pending', 'In review', 'Rejected'].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="primary-button" onClick={() => setNotice({ type: 'success', message: 'Approval queue updated.' })}>Apply approvals</button>
              </div>
            </div>
          </section>
        );
      }

      return appAdminPages[activePage] || appAdminPages.overview;
    }

    if (user?.role === 'management') {
      return managementPages[activePage] || managementPages.overview;
    }

    if (user?.role === 'main-admin') {
      return mainAdminPages[activePage] || mainAdminPages.overview;
    }

    return renderOverviewPage();
  };

  const renderCurrentPage = () => {
    if (user?.role === 'student') {
      if (activePage === 'overview') return renderOverviewPage();
      if (activePage === 'attendance') return renderAttendancePage();
      if (activePage === 'timetable') return renderTimetablePage();
      if (activePage === 'assignments') return renderAssignmentsPage();
      if (activePage === 'ai-planner') return renderAiPlannerPage();
      return renderOverviewPage();
    }

    return renderRoleAccessPage();
  };

  return (
    <div className="app-shell dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-badge">SA</div>
          <div>
            <strong>StudyAgent</strong>
            <small>Academic planning</small>
          </div>
        </div>

        <nav className="nav-stack">
          {navItems.map((item) => (
            <button key={item.key} type="button" className={`nav-item ${activePage === item.key ? 'active' : ''}`} onClick={() => setActivePage(item.key)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <p>System status</p>
          <strong>AI plan active</strong>
          <span>LocalStorage only</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Role portal</p>
            <h2>{formatRoleLabel(user.role)}</h2>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={handleExport}><Download size={16} /></button>
            <button type="button" className="icon-button" onClick={handlePrint}><FileText size={16} /></button>
            <button type="button" className="logout-button" onClick={handleLogout}><LogOut size={16} />Logout</button>
          </div>
        </header>

        {notice.message ? <div className={`alert ${notice.type}`}>{notice.message}</div> : null}

        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
