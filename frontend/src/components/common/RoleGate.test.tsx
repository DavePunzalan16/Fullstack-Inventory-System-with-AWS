/**
 * Component test: RoleGate renders children only for admins (Req 12.7, 12.8).
 */

import { screen } from '@testing-library/react';

import { RoleGate } from './RoleGate';
import { renderWithStore } from '@/test-utils';

const child = <button type="button">Admin action</button>;

test('renders children for an admin user', () => {
  renderWithStore(<RoleGate>{child}</RoleGate>, {
    user: { id: '1', name: 'A', email: 'a@b.com', role: 'admin' },
  });
  expect(screen.getByRole('button', { name: 'Admin action' })).toBeInTheDocument();
});

test('renders nothing for a staff user (absent from DOM)', () => {
  renderWithStore(<RoleGate>{child}</RoleGate>, {
    user: { id: '2', name: 'S', email: 's@b.com', role: 'staff' },
  });
  expect(screen.queryByRole('button', { name: 'Admin action' })).not.toBeInTheDocument();
});

test('renders nothing when there is no user', () => {
  renderWithStore(<RoleGate>{child}</RoleGate>, { user: null });
  expect(screen.queryByRole('button', { name: 'Admin action' })).not.toBeInTheDocument();
});
