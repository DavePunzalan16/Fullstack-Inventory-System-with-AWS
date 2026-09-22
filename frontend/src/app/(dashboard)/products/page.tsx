'use client';

/**
 * Products page (Req 3.x, 4.x): grid for all users; Add Product form (modal)
 * gated to Admin. Create mutation invalidates the Product cache so the grid
 * refreshes without a full reload (Req 4.9); success shows a toast.
 */

import { useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { RoleGate } from '@/components/common/RoleGate';
import { ErrorState } from '@/components/common/States';
import { Toast } from '@/components/common/Toast';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useCreateProductMutation } from '@/state/api';
import type { ProductInput } from '@/types';

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [createProduct, { isLoading, isError, reset }] = useCreateProductMutation();

  const handleCreate = async (input: ProductInput) => {
    try {
      await createProduct(input).unwrap();
      setShowForm(false);
      reset();
      setToast(`Product "${input.name}" created.`);
    } catch {
      // Error surfaced via isError inside the modal.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-white">Products</h1>
        <RoleGate>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black"
          >
            Add Product
          </button>
        </RoleGate>
      </div>

      <ProductGrid />

      <Modal title="Add Product" isOpen={showForm} onClose={() => { setShowForm(false); reset(); }}>
        {isError && <div className="mb-3"><ErrorState message="Could not create the product. Check the fields and try again." /></div>}
        <ProductForm onSubmit={handleCreate} submitting={isLoading} />
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
