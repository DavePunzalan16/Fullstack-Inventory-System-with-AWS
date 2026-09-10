/**
 * Property-based test for theme persistence (Property 20).
 *
 * For any sequence of theme selections, the last selection is the one that is
 * persisted and read back; when no preference has ever been stored, the default
 * is dark.
 */

import fc from 'fast-check';

import { persistTheme, readPersistedTheme, type ThemeMode } from '@/state/themeSlice';

beforeEach(() => {
  window.localStorage.clear();
});

// Feature: inventory-management-dashboard, Property 20: Theme persistence and retention
test('Property 20: the last selected theme is retained; default is dark when unset', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom<ThemeMode>('dark', 'light'), { minLength: 1, maxLength: 20 }),
      (selections) => {
        window.localStorage.clear();
        for (const mode of selections) {
          persistTheme(mode);
        }
        const last = selections[selections.length - 1];
        return readPersistedTheme() === last;
      },
    ),
    { numRuns: 200 },
  );

  // No stored preference -> default dark.
  window.localStorage.clear();
  expect(readPersistedTheme()).toBe('dark');
});
