import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoleNavItems, roleMeta } from './roleConfig.js';

test('role metadata has the required academic roles', () => {
  assert.deepEqual(Object.keys(roleMeta).sort(), ['app-admin', 'main-admin', 'management', 'student', 'tech']);
});

test('students keep academic modules while admin roles have separate access', () => {
  const studentNav = getRoleNavItems('student').map((item) => item.key);
  const techNav = getRoleNavItems('tech').map((item) => item.key);

  assert.deepEqual(studentNav, ['overview', 'attendance', 'timetable', 'assignments', 'ai-planner']);
  assert.deepEqual(techNav.slice(0, 3), ['overview', 'system-health', 'integrations']);
  assert.ok(!techNav.includes('attendance'));
});
