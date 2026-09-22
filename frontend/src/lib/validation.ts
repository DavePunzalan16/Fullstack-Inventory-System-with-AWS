/**
 * Client-side form validation (Req 4.x, 7.x, 11.2, 11.3) mirroring API bounds.
 * Pure functions returning per-field error maps so components can render
 * inline errors without a form library.
 */

import type { ProductInput } from '@/types';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Validates the product create/edit form (mirrors API Req 4.1). */
export function validateProduct(input: Partial<ProductInput>): FieldErrors<ProductInput> {
  const errors: FieldErrors<ProductInput> = {};
  if (!input.name || input.name.length < 1 || input.name.length > 255) {
    errors.name = 'Name must be 1-255 characters';
  }
  if (!input.sku || input.sku.length < 1 || input.sku.length > 50) {
    errors.sku = 'SKU must be 1-50 characters';
  }
  if (input.price === undefined || input.price < 0.01 || input.price > 999999.99) {
    errors.price = 'Price must be between 0.01 and 999999.99';
  }
  if (
    input.stockQuantity === undefined ||
    !Number.isInteger(input.stockQuantity) ||
    input.stockQuantity < 0 ||
    input.stockQuantity > 999999
  ) {
    errors.stockQuantity = 'Stock must be an integer 0-999999';
  }
  if (
    input.reorderThreshold === undefined ||
    !Number.isInteger(input.reorderThreshold) ||
    input.reorderThreshold < 0 ||
    input.reorderThreshold > 999999
  ) {
    errors.reorderThreshold = 'Threshold must be an integer 0-999999';
  }
  if (input.rating === undefined || input.rating < 0 || input.rating > 5) {
    errors.rating = 'Rating must be between 0 and 5';
  }
  if (!input.categoryId) {
    errors.categoryId = 'Category is required';
  }
  return errors;
}

/** Validates email format. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validates the sign-up form (Req 11.2, 11.3). */
export function validateSignUp(input: {
  email: string;
  password: string;
  name: string;
}): FieldErrors<{ email: string; password: string; name: string }> {
  const errors: FieldErrors<{ email: string; password: string; name: string }> = {};
  if (!isValidEmail(input.email)) errors.email = 'Enter a valid email address';
  if (input.name.length < 1 || input.name.length > 256) {
    errors.name = 'Name must be 1-256 characters';
  }
  // Mirror a typical Cognito policy: >=8 chars, upper, lower, digit.
  if (
    input.password.length < 8 ||
    !/[a-z]/.test(input.password) ||
    !/[A-Z]/.test(input.password) ||
    !/\d/.test(input.password)
  ) {
    errors.password = 'Password must be 8+ chars with upper, lower, and a number';
  }
  return errors;
}
