'use client';

/**
 * ProductGrid (Req 3.1â€“3.6): MUI DataGrid with server-side pagination, sorting,
 * and filtering, a low-stock badge on low-stock rows, and an empty-state on
 * zero matches. Data flows via RTK Query.
 */

import {
  DataGrid,
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import boxnode from '@/Assets/boxnode.png';
import { LowStockBadge } from './LowStockBadge';
import { EmptyState, ErrorState, isConnectionError } from '@/components/common/States';
import { useGetProductsQuery } from '@/state/api';
import type { Product } from '@/types';

const columns: GridColDef<Product>[] = [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    renderCell: (params) => (
      <span className="flex items-center gap-2">
        {params.row.name}
        {params.row.isLowStock && <LowStockBadge />}
      </span>
    ),
  },
  { field: 'sku', headerName: 'SKU', width: 140 },
  { field: 'price', headerName: 'Price', width: 120 },
  { field: 'stockQuantity', headerName: 'Stock', width: 100 },
  { field: 'rating', headerName: 'Rating', width: 100 },
  {
    field: 'category',
    headerName: 'Category',
    width: 160,
    valueGetter: (_value, row) => row.category?.name ?? '',
  },
];

export function ProductGrid() {
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sort, setSort] = useState<GridSortModel>([]);
  const [filter, setFilter] = useState<GridFilterModel>({ items: [] });

  const query = useMemo(() => {
    const sortItem = sort[0];
    const filterItem = filter.items[0];
    return {
      page: pagination.page + 1,
      pageSize: pagination.pageSize,
      sortBy: sortItem?.field,
      sortDir: (sortItem?.sort ?? undefined) as 'asc' | 'desc' | undefined,
      ...(filterItem?.field === 'name' && filterItem.value
        ? { name: String(filterItem.value) }
        : {}),
      ...(filterItem?.field === 'sku' && filterItem.value
        ? { sku: String(filterItem.value) }
        : {}),
    };
  }, [pagination, sort, filter]);

  const { data, isLoading, isError, error, refetch } = useGetProductsQuery(query);
  const rows = data?.data ?? [];

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} message={isConnectionError(error) ? undefined : 'Could not load products.'} />;
  }

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        illustration={boxnode}
        illustrationAlt=""
        message="No products match the current filters. Use the Add Product button to create one."
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={data?.total ?? 0}
        loading={isLoading}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        onSortModelChange={setSort}
        onFilterModelChange={setFilter}
        autoHeight
        disableRowSelectionOnClick
      />
    </div>
  );
}
