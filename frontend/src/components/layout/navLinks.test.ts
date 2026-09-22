/**
 * Unit tests for sidebar nav links (Req 10.1, 6.5).
 */

import { NAV_LINKS, visibleLinks } from './navLinks';

test('exactly five links in the specified order', () => {
  expect(NAV_LINKS.map((l) => l.label)).toEqual([
    'Dashboard',
    'Products',
    'Users',
    'Expenses',
    'Settings',
  ]);
});

test('Users link is hidden for staff and undefined roles', () => {
  expect(visibleLinks('staff').map((l) => l.label)).not.toContain('Users');
  expect(visibleLinks(undefined).map((l) => l.label)).not.toContain('Users');
});

test('Users link is visible for admins', () => {
  expect(visibleLinks('admin').map((l) => l.label)).toContain('Users');
});
