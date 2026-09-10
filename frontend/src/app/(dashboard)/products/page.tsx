'use client';

/**
 * Products page (Req 3.x, 4.x): grid for all users; create form gated to Admin.
 * Mutations invalidate the Product cache so the grid reflects changes without a
 * full reload (Req 4.9).
 */

import { useState } from 'react';

import { ProductForm } from '@/components/products/ProductForm';
import { ProductGrid } from '@/components/products/ProductGrid';
import { RoleGate } from '@/components/common/RoleGate';
import { ErrorState } from '@/components/common/States';
import { useCreateProductMutation } from '@/state/api';
import type { ProductInput } from '@/types';

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [createProduct, { isLoading, isError }] = useCreateProductMutation();

  const handleCreate = async (input: ProductInput) => {
    try {
      await createProduct(input).unwrap();
      setShowForm(false);
    } catch {
      // Error surfaced via isError below.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-white">Products</h1>
        <RoleGate>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black"
          >
            {showForm ? 'Close' : 'New product'}
          </button>
        </RoleGate>
      </div>

      {showForm && (
        <RoleGate>
          <div className="rounded-md bg-surface p-4">
            {isError && <ErrorState message="Could not create the product." />}
            <ProductForm onSubmit={handleCreate} submitting={isLoading} />
          </div>
        </RoleGate>
      )}

      <ProductGrid />
    </div>
  );
}
