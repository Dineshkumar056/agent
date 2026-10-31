const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'studyagent-dev-secret';
const DATA_PATH = path.join(__dirname, 'data', 'studyagent.json');
const ROLE_MAP = {
  student: 'Student',
  tech: 'Tech',
  'app-admin': 'App Admin',
  management: 'Management',
  'main-admin': 'Main Admin',
};

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error('StudyAgent data file not found at backend/data/studyagent.json');
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getUserByEmail(email) {
  const data = loadData();
  return data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function getProfileByUserId(userId) {
  const data = loadData();
  return data.students.find((s) => s.user_id === userId) || null;
}

function issueToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized. Please sign in again.' });
  }

  req.user = user;
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have sufficient permissions for this action.' });
    }
    next();
  };
}

function logAudit(actor, action, details) {
  const data = loadData();
  data.auditLogs = data.auditLogs || [];
  data.auditLogs.unshift({
    id: Date.now(),
    actor,
    action,
    details,
    created_at: new Date().toISOString(),
  });
  saveData(data);
}

function buildAiPlan(studentId, customScenario = {}) {
  const data = loadData();
  const student = data.students.find((item) => item.id === Number(studentId));
  if (!student) {
    return { summary: 'No student found.', schedule: [], recommendations: [], changes: [], previousTimetable: [], updatedTimetable: [] };
  }

  const studentUser = data.users.find((u) => u.id === student.user_id);
  const tasks = data.assignments.filter((task) => task.student_id === student.id);
  const timetable = data.timetableEntries.filter((entry) => entry.student_id === student.id);
  const examDates = data.exams.filter((exam) => exam.student_id === student.id);
  const attendanceRisk = Math.max(0, 100 - student.attendance);
  const weakSubjects = ['Algorithms', 'Machine Learning'];
  const availability = Number(student.study_hours_per_day || 3);

  const dailyHours = [
    { time: '07:00-08:00', subject: 'Algorithms', focus: 'Revision' },
    { time: '08:30-09:30', subject: 'DBMS', focus: 'Practice' },
    { time: '18:00-19:00', subject: 'Machine Learning', focus: 'Concepts' },
    { time: '19:30-20:30', subject: 'Project Work', focus: 'Portfolio' },
  ].slice(0, availability || 3);

  const weeklyPlan = [
    { day: 'Monday', subject: 'Algorithms', hours: 1.5, task: 'Solve previous questions' },
    { day: 'Tuesday', subject: 'DBMS', hours: 1.5, task: 'Lab exercise & revision' },
    { day: 'Wednesday', subject: 'Machine Learning', hours: 2, task: 'Model review & projects' },
    { day: 'Thursday', subject: 'Operating Systems', hours: 1.5, task: 'Quiz prep' },
    { day: 'Friday', subject: 'Project Work', hours: 2, task: 'Major project sprint' },
  ];

  const recommendations = [
    'Prioritise weak subjects with lower internal marks and upcoming deadlines.',
    'Protect revision windows before every internal exam and practical lab session.',
    'Keep a 30-minute buffer after each class for recap and quick notes.',
  ];

  const changes = [];
  const explanations = [];

  if (customScenario?.type === 'holiday') {
    changes.push({ title: 'Holiday adjustment', description: 'Removed class blocks on the announced holiday and shifted revision to free time.' });
    explanations.push('Because the college announced a holiday, the AI moved affected classes into flexible revision slots rather than forcing a conflict-heavy plan.');
  }

  if (customScenario?.type === 'missed-class') {
    changes.push({ title: 'Missed class recovery', description: 'Added the missed topic to revision and scheduled a catch-up session.' });
    explanations.push('A missed class increases the chance of content gaps, so the system inserted a revision block around the affected subject.');
  }

  if (customScenario?.type === 'deadline-change') {
    changes.push({ title: 'Deadline update', description: 'Reordered the task queue and moved the assignment revision to the earliest available slot.' });
    explanations.push('The deadline moved earlier, which raised the urgency score and caused the AI to prioritise the affected assignment before optional review sessions.');
  }

  if (customScenario?.type === 'exam-postponed') {
    changes.push({ title: 'Exam update', description: 'Rebalanced preparation time to maintain a realistic workload and avoid overcrowding the next week.' });
    explanations.push('A postponed exam created a lower near-term urgency, so the plan preserved revision coverage while releasing some time for project tasks.');
  }

  if (attendanceRisk > 20) {
    changes.push({ title: 'Attendance recovery plan', description: `Attendance is ${student.attendance}% and requires additional revision emphasis.` });
    explanations.push('Low attendance reduces confidence in lecture coverage, so the planner adds quick recap sessions and focuses on high-weight subjects.');
  }

  const summary = {
    studentName: studentUser?.name || 'Student',
    attendance: student.attendance,
    internalMarks: student.internal_marks,
    tasksPending: tasks.length,
    examCount: examDates.length,
    weakSubjects,
    studyHours: availability,
    priority: attendanceRisk > 20 ? 'High' : 'Balanced',
  };

  return {
    summary,
    previousTimetable: timetable,
    updatedTimetable: timetable.map((entry, index) => ({
      ...entry,
      revision: index % 2 === 0 ? 'Reinforce missed concepts' : 'Revision slot',
      adjusted: Boolean(customScenario?.type) || entry.subject === weakSubjects[0],
    })),
    schedule: dailyHours,
    weeklyPlan,
    recommendations,
    changes,
    explanations,
    nextAction: 'Follow the revision blocks before each assessment and keep a 45-minute catch-up window after every missed class.',
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyAgent backend is running.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const data = loadData();
  const user = data.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: 'This account is not assigned to the selected role.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = issueToken(user);
  logAudit(user.name, 'login', `User logged in as ${ROLE_MAP[user.role] || user.role}`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      department: user.department,
      register_number: user.register_number,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, register_number, email, college, department, course, year, semester, study_hours_per_day, password } = req.body || {};

  if (!name || !register_number || !email || !college || !department || !course || !year || !semester || !password) {
    return res.status(400).json({ message: 'Please complete all required student registration fields.' });
  }

  const data = loadData();
  if (data.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const newId = (data.users.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
  const newUser = {
    id: newId,
    name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    role: 'student',
    college,
    department,
    register_number,
  };

  data.users.push(newUser);
  data.students.push({
    id: (data.students.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1,
    user_id: newId,
    register_number,
    college,
    department,
    course,
    year,
    semester,
    study_hours_per_day: Number(study_hours_per_day || 3),
    attendance: 85,
    internal_marks: 78,
    completed_classes: 24,
    missed_classes: 3,
    weekly_hours: 12,
  });

  data.notifications = data.notifications || [];
  data.notifications.unshift({
    id: Date.now(),
    user_id: newId,
    title: 'Welcome to StudyAgent',
    message: 'Your student account has been created. AI study insights are now available.',
    type: 'welcome',
  });

  saveData(data);

  logAudit(name, 'student_register', `Registered ${register_number} for ${department}`);
  return res.status(201).json({ message: 'Student registration successful. You can now sign in.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'No account found for that email address.' });
  }

  logAudit(user.name, 'forgot_password', `Reset link requested for ${email}`);
  return res.json({ message: `A password reset link has been sent to ${email}. Demo mode: use your existing account password.` });
});

app.get('/api/me', requireAuth, (req, res) => {
  const data = loadData();
  const user = data.users.find((item) => item.id === Number(req.user.id));
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      department: user.department,
      register_number: user.register_number,
    },
  });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const data = loadData();
  const user = data.users.find((item) => item.id === Number(req.user.id));
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const profile = data.students.find((item) => item.user_id === user.id) || {
    attendance: 78,
    internal_marks: 80,
    study_hours_per_day: 3,
    completed_classes: 18,
    missed_classes: 2,
  };

  const tasks = data.assignments.filter((item) => item.student_id === profile.id || user.role !== 'student');
  const notifications = (data.notifications || []).filter((item) => item.user_id === user.id || user.role !== 'student');
  const announcements = data.announcements || [];
  const summary = {
    role: user.role,
    name: user.name,
    attendance: profile.attendance || 0,
    internalMarks: profile.internal_marks || 0,
    pendingTasks: tasks.length,
    studyHours: profile.study_hours_per_day || 3,
    alerts: notifications.length,
  };

  res.json({ user, profile, tasks, notifications, announcements, summary });
});

app.get('/api/subjects', requireAuth, (req, res) => {
  const data = loadData();
  res.json(data.subjects || []);
});

app.get('/api/tasks', requireAuth, (req, res) => {
  const data = loadData();
  const user = data.users.find((item) => item.id === Number(req.user.id));
  const profile = data.students.find((item) => item.user_id === user.id) || null;

  const tasks = data.assignments.filter((item) => profile ? item.student_id === profile.id : true);
  res.json(tasks);
});

app.get('/api/students', requireAuth, (req, res) => {
  const data = loadData();
  res.json(data.students.map((student) => ({
    ...student,
    user: data.users.find((u) => u.id === student.user_id),
  })));
});

app.get('/api/announcements', requireAuth, (req, res) => {
  const data = loadData();
  res.json(data.announcements || []);
});

app.get('/api/ai-plan/:studentId', requireAuth, (req, res) => {
  const { studentId } = req.params;
  res.json(buildAiPlan(Number(studentId), {}));
});

app.post('/api/what-if', requireAuth, (req, res) => {
  const { studentId, type } = req.body || {};
  res.json(buildAiPlan(Number(studentId || req.user.id), { type }));
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, subject, due_date, status, priority } = req.body || {};
  if (!title || !subject || !due_date) {
    return res.status(400).json({ message: 'Task title, subject and due date are required.' });
  }

  const data = loadData();
  const profile = data.students.find((item) => item.user_id === Number(req.user.id));
  const newTask = {
    id: (data.assignments.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1,
    student_id: profile ? profile.id : 1,
    title,
    subject,
    due_date,
    status: status || 'pending',
    priority: priority || 'medium',
  };

  data.assignments.push(newTask);
  saveData(data);
  logAudit(req.user.name, 'task_created', `Added task: ${title}`);

  res.status(201).json({ message: 'Academic task saved successfully.', task: newTask });
});

app.get('/api/summary', requireAuth, (req, res) => {
  const data = loadData();
  const summary = {
    totalStudents: data.students.length,
    totalTasks: data.assignments.length,
    totalDepartments: data.departments.length,
    averageAttendance: Math.round((data.students.reduce((sum, item) => sum + (item.attendance || 0), 0) / data.students.length) || 0),
    activeAlerts: data.notifications?.length || 0,
  };

  res.json(summary);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.', details: err.message });
});

app.listen(PORT, () => {
  console.log(`StudyAgent backend running on http://localhost:${PORT}`);
});
