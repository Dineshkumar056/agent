export const roleMeta = {
  student: { title: 'Student Login', email: 'student@college.edu', password: 'student123' },
  tech: { title: 'Tech Login', email: 'tech@college.edu', password: 'tech123' },
  'app-admin': { title: 'App Admin Login', email: 'appadmin@college.edu', password: 'appadmin123' },
  management: { title: 'Management Login', email: 'mgmt@college.edu', password: 'mgmt123' },
  'main-admin': { title: 'Main Admin Login', email: 'superadmin@college.edu', password: 'admin123' },
};

export function getRoleNavItems(role = 'student') {
  const maps = {
    student: [
      { key: 'overview', label: 'Overview' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'timetable', label: 'Timetable' },
      { key: 'assignments', label: 'Assignments' },
      { key: 'ai-planner', label: 'AI Planner' },
    ],
    tech: [
      { key: 'overview', label: 'Overview' },
      { key: 'system-health', label: 'System Health' },
      { key: 'integrations', label: 'Integrations' },
      { key: 'security', label: 'Security' },
      { key: 'reports', label: 'Reports' },
    ],
    'app-admin': [
      { key: 'overview', label: 'Overview' },
      { key: 'students', label: 'Students' },
      { key: 'approvals', label: 'Approvals' },
      { key: 'departments', label: 'Departments' },
      { key: 'alerts', label: 'Alerts' },
    ],
    management: [
      { key: 'overview', label: 'Overview' },
      { key: 'performance', label: 'Performance' },
      { key: 'approvals', label: 'Approvals' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'reports', label: 'Reports' },
    ],
    'main-admin': [
      { key: 'overview', label: 'Overview' },
      { key: 'users', label: 'Users' },
      { key: 'security', label: 'Security' },
      { key: 'systems', label: 'Systems' },
      { key: 'settings', label: 'Settings' },
    ],
  };

  return maps[role] || maps.student;
}
