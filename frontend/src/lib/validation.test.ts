/**
 * Unit tests for client-side validation (Req 4.1, 11.2, 11.3).
 */

import { isValidEmail, validateProduct, validateSignUp } from './validation';

describe('validateProduct', () => {
  test('accepts a valid product with no errors', () => {
    const errors = validateProduct({
      name: 'Widget',
      sku: 'W-1',
      price: 9.99,
      stockQuantity: 5,
      reorderThreshold: 2,
      rating: 4.5,
      categoryId: 'cat-1',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('flags out-of-range and missing fields', () => {
    const errors = validateProduct({
      name: '',
      sku: '',
      price: 0,
      stockQuantity: -1,
      reorderThreshold: 1.5,
      rating: 9,
      categoryId: '',
    });
    expect(errors.name).toBeDefined();
    expect(errors.sku).toBeDefined();
    expect(errors.price).toBeDefined();
    expect(errors.stockQuantity).toBeDefined();
    expect(errors.reorderThreshold).toBeDefined();
    expect(errors.rating).toBeDefined();
    expect(errors.categoryId).toBeDefined();
  });
});

describe('validateSignUp / isValidEmail', () => {
  test('rejects invalid email and weak password', () => {
    const errors = validateSignUp({ email: 'nope', password: 'weak', name: 'A' });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  test('accepts a strong password and valid email', () => {
    const errors = validateSignUp({ email: 'a@b.com', password: 'Abcdef12', name: 'Alice' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('isValidEmail basic cases', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('bad@')).toBe(false);
  });
});
