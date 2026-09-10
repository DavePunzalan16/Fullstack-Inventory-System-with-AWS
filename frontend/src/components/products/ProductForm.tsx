'use client';

/**
 * ProductForm (Req 4.1, 4.2, 5.5): create/edit with client validation that
 * mirrors the API, plus image upload. Submit is delegated to the parent
 * (which calls the RTK Query mutation).
 */

import { useState } from 'react';

import { ImageUpload } from './ImageUpload';
import { validateProduct, type FieldErrors } from '@/lib/validation';
import type { Product, ProductInput } from '@/types';

interface ProductFormProps {
  initial?: Product;
  onSubmit: (input: ProductInput, image?: File) => void;
  submitting?: boolean;
}

const FIELDS: { key: keyof ProductInput; label: string; type: string }[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'stockQuantity', label: 'Stock quantity', type: 'number' },
  { key: 'reorderThreshold', label: 'Reorder threshold', type: 'number' },
  { key: 'rating', label: 'Rating', type: 'number' },
  { key: 'categoryId', label: 'Category ID', type: 'text' },
];

export function ProductForm({ initial, onSubmit, submitting }: ProductFormProps) {
  const [values, setValues] = useState<Partial<ProductInput>>({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    price: initial ? Number(initial.price) : undefined,
    stockQuantity: initial?.stockQuantity,
    reorderThreshold: initial?.reorderThreshold,
    rating: initial ? Number(initial.rating) : undefined,
    categoryId: initial?.categoryId ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<ProductInput>>({});
  const [image, setImage] = useState<File | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateProduct(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    onSubmit(values as ProductInput, image);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="Product form">
      <ImageUpload imageUrl={initial?.imageUrl ?? null} onSelect={setImage} />

      {FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-sm text-offwhite">
          {f.label}
          <input
            type={f.type}
            step={f.type === 'number' ? 'any' : undefined}
            aria-label={f.label}
            value={values[f.key] ?? ''}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
              }))
            }
            className="rounded bg-surface px-3 py-2 text-white"
          />
          {errors[f.key] && (
            <span role="alert" className="text-xs text-red-400">
              {errors[f.key]}
            </span>
          )}
        </label>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60"
      >
        {initial ? 'Save changes' : 'Create product'}
      </button>
    </form>
  );
}
