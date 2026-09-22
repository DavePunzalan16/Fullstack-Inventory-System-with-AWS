/**
 * Component test: SummaryCard states (Req 1.1, 1.7).
 */

import { render, screen } from '@testing-library/react';

import { SummaryCard } from './SummaryCard';

test('shows the value when loaded', () => {
  render(<SummaryCard title="Total products" value={42} />);
  expect(screen.getByTestId('summary-value')).toHaveTextContent('42');
});

test('shows a loading indicator while loading', () => {
  render(<SummaryCard title="Total products" value={0} isLoading />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});

test('shows an error indication and retains the passed (last-good) value', () => {
  render(<SummaryCard title="Total products" value={99} isError />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByTestId('summary-value')).toHaveTextContent('99');
});
