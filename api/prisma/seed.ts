/**
 * Prisma seed script (Requirements 13.7, 13.8, 13.9).
 *
 * Strategy: clear-and-reseed. On every run we delete all existing records in
 * a foreign-key-safe order and then insert a fixed, deterministic dataset.
 * Because the dataset is deterministic and we always start from an empty set,
 * re-running the script produces:
 *   - no duplicate-key errors (13.8), and
 *   - identical record counts every time (13.8).
 *
 * The dataset satisfies 13.7:
 *   - >= 10 products across >= 3 categories
 *   - >= 3 users (>= 1 admin, >= 1 staff)
 *   - >= 10 expenses
 *   - >= 5 stock movements
 *
 * On a database connection failure the script exits with a non-zero code and a
 * clear message identifying the connection failure (13.9).
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Enum values are supplied as string literals matching the Prisma schema enums
// (Role, MovementType). Prisma Client accepts these literal values for enum
// fields, which keeps the seed script decoupled from generated enum objects.
type Role = 'admin' | 'staff';
type MovementType = 'restock' | 'sale' | 'adjustment';

// ---------------------------------------------------------------------------
// Deterministic seed data
// ---------------------------------------------------------------------------

interface CategorySeed {
  key: string;
  name: string;
  description: string | null;
}

interface ProductSeed {
  key: string;
  categoryKey: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: number;
  reorderThreshold: number;
  rating: string;
  imageUrl: string | null;
}

interface UserSeed {
  key: string;
  cognitoSub: string;
  name: string;
  email: string;
  role: Role;
  // Optional plaintext password for LOCAL DEV email/password login. Hashed at seed time.
  password?: string;
}

interface ExpenseSeed {
  category: string;
  amount: string;
  date: string; // ISO date (YYYY-MM-DD)
  notes: string | null;
}

interface MovementSeed {
  productKey: string;
  userKey: string;
  type: MovementType;
  quantity: number;
}

const categories: CategorySeed[] = [
  { key: 'hardware', name: 'Hardware', description: 'Physical tools and components' },
  { key: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories' },
  { key: 'office', name: 'Office Supplies', description: 'Stationery and workplace consumables' },
  { key: 'furniture', name: 'Furniture', description: 'Desks, chairs, and storage' },
];

const products: ProductSeed[] = [
  { key: 'p01', categoryKey: 'hardware', name: 'Cordless Drill', sku: 'HW-DRILL-001', price: '89.99', stockQuantity: 42, reorderThreshold: 10, rating: '4.60', imageUrl: null },
  { key: 'p02', categoryKey: 'hardware', name: 'Hammer 16oz', sku: 'HW-HAMMER-002', price: '15.50', stockQuantity: 8, reorderThreshold: 12, rating: '4.20', imageUrl: null },
  { key: 'p03', categoryKey: 'hardware', name: 'Screwdriver Set', sku: 'HW-SCRSET-003', price: '24.99', stockQuantity: 30, reorderThreshold: 15, rating: '4.80', imageUrl: null },
  { key: 'p04', categoryKey: 'electronics', name: 'USB-C Charger 65W', sku: 'EL-CHRG-004', price: '39.99', stockQuantity: 5, reorderThreshold: 20, rating: '4.10', imageUrl: null },
  { key: 'p05', categoryKey: 'electronics', name: 'Wireless Mouse', sku: 'EL-MOUSE-005', price: '19.99', stockQuantity: 120, reorderThreshold: 25, rating: '4.30', imageUrl: null },
  { key: 'p06', categoryKey: 'electronics', name: 'Mechanical Keyboard', sku: 'EL-KEYB-006', price: '79.00', stockQuantity: 18, reorderThreshold: 10, rating: '4.70', imageUrl: null },
  { key: 'p07', categoryKey: 'office', name: 'A4 Paper Ream', sku: 'OF-PAPER-007', price: '6.49', stockQuantity: 200, reorderThreshold: 50, rating: '4.00', imageUrl: null },
  { key: 'p08', categoryKey: 'office', name: 'Ballpoint Pens (12pk)', sku: 'OF-PENS-008', price: '4.25', stockQuantity: 9, reorderThreshold: 30, rating: '3.90', imageUrl: null },
  { key: 'p09', categoryKey: 'office', name: 'Sticky Notes Pack', sku: 'OF-NOTES-009', price: '3.75', stockQuantity: 75, reorderThreshold: 20, rating: '4.40', imageUrl: null },
  { key: 'p10', categoryKey: 'furniture', name: 'Ergonomic Office Chair', sku: 'FN-CHAIR-010', price: '229.99', stockQuantity: 6, reorderThreshold: 5, rating: '4.50', imageUrl: null },
  { key: 'p11', categoryKey: 'furniture', name: 'Standing Desk', sku: 'FN-DESK-011', price: '399.00', stockQuantity: 4, reorderThreshold: 4, rating: '4.65', imageUrl: null },
  { key: 'p12', categoryKey: 'furniture', name: 'Filing Cabinet', sku: 'FN-CAB-012', price: '149.50', stockQuantity: 11, reorderThreshold: 6, rating: '4.15', imageUrl: null },
];

const users: UserSeed[] = [
  // LOCAL DEV SEED ONLY. Do NOT ship this credential to production: before
  // deploying, change this password or have the seed read it from an env var
  // (e.g. SEED_ADMIN_PASSWORD). See README (Batch 3) for the warning.
  { key: 'admin0', cognitoSub: 'local:seed-admin', name: 'Admin', email: 'admin@gmail.com', role: 'admin', password: 'admin123' },
  { key: 'admin1', cognitoSub: 'seed-cognito-sub-admin-1', name: 'Alice Admin', email: 'alice.admin@example.com', role: 'admin' },
  { key: 'admin2', cognitoSub: 'seed-cognito-sub-admin-2', name: 'Aaron Admin', email: 'aaron.admin@example.com', role: 'admin' },
  { key: 'staff1', cognitoSub: 'seed-cognito-sub-staff-1', name: 'Sam Staff', email: 'sam.staff@example.com', role: 'staff' },
  { key: 'staff2', cognitoSub: 'seed-cognito-sub-staff-2', name: 'Sara Staff', email: 'sara.staff@example.com', role: 'staff' },
];

const expenses: ExpenseSeed[] = [
  { category: 'Utilities', amount: '250.00', date: '2025-01-05', notes: 'January electricity' },
  { category: 'Utilities', amount: '180.75', date: '2025-02-05', notes: 'February electricity' },
  { category: 'Rent', amount: '1200.00', date: '2025-01-01', notes: 'January office rent' },
  { category: 'Rent', amount: '1200.00', date: '2025-02-01', notes: 'February office rent' },
  { category: 'Supplies', amount: '85.40', date: '2025-01-12', notes: 'Restock of office supplies' },
  { category: 'Supplies', amount: '42.10', date: '2025-02-18', notes: 'Printer toner' },
  { category: 'Marketing', amount: '500.00', date: '2025-01-20', notes: 'Online ads campaign' },
  { category: 'Marketing', amount: '320.00', date: '2025-02-22', notes: 'Trade show booth' },
  { category: 'Travel', amount: '640.25', date: '2025-01-28', notes: 'Client visit airfare' },
  { category: 'Travel', amount: '210.00', date: '2025-02-14', notes: 'Local transport' },
  { category: 'Software', amount: '99.00', date: '2025-01-15', notes: 'SaaS subscription' },
  { category: 'Software', amount: '99.00', date: '2025-02-15', notes: 'SaaS subscription' },
];

const movements: MovementSeed[] = [
  { productKey: 'p01', userKey: 'admin1', type: 'restock', quantity: 50 },
  { productKey: 'p01', userKey: 'staff1', type: 'sale', quantity: -8 },
  { productKey: 'p04', userKey: 'admin1', type: 'sale', quantity: -15 },
  { productKey: 'p05', userKey: 'admin2', type: 'restock', quantity: 100 },
  { productKey: 'p06', userKey: 'staff2', type: 'adjustment', quantity: -2 },
  { productKey: 'p10', userKey: 'admin1', type: 'restock', quantity: 6 },
  { productKey: 'p11', userKey: 'admin2', type: 'sale', quantity: -1 },
];

// ---------------------------------------------------------------------------
// Seeding routine
// ---------------------------------------------------------------------------

async function clearAll(): Promise<void> {
  // Delete in FK-safe order: children before parents.
  // StockMovement references Product and User; Product references Category.
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
}

async function seed(): Promise<void> {
  await clearAll();

  // Categories
  const categoryIdByKey = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.create({
      data: { name: c.name, description: c.description },
    });
    categoryIdByKey.set(c.key, created.id);
  }

  // Users
  const userIdByKey = new Map<string, string>();
  for (const u of users) {
    const created = await prisma.user.create({
      data: {
        cognitoSub: u.cognitoSub,
        name: u.name,
        email: u.email,
        role: u.role,
        // LOCAL DEV ONLY: hash the seed password so email/password login works
        // locally. Never seed real production credentials this way.
        passwordHash: u.password ? await bcrypt.hash(u.password, 10) : null,
      },
    });
    userIdByKey.set(u.key, created.id);
  }

  // Products
  const productIdByKey = new Map<string, string>();
  for (const p of products) {
    const categoryId = categoryIdByKey.get(p.categoryKey);
    if (categoryId === undefined) {
      throw new Error(`Seed data error: unknown categoryKey "${p.categoryKey}" for product "${p.sku}"`);
    }
    const created = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        stockQuantity: p.stockQuantity,
        reorderThreshold: p.reorderThreshold,
        rating: p.rating,
        categoryId,
        imageUrl: p.imageUrl,
      },
    });
    productIdByKey.set(p.key, created.id);
  }

  // Expenses
  for (const e of expenses) {
    await prisma.expense.create({
      data: {
        category: e.category,
        amount: e.amount,
        date: new Date(e.date),
        notes: e.notes,
      },
    });
  }

  // Stock movements
  for (const m of movements) {
    const productId = productIdByKey.get(m.productKey);
    const createdByUserId = userIdByKey.get(m.userKey);
    if (productId === undefined) {
      throw new Error(`Seed data error: unknown productKey "${m.productKey}" for stock movement`);
    }
    if (createdByUserId === undefined) {
      throw new Error(`Seed data error: unknown userKey "${m.userKey}" for stock movement`);
    }
    await prisma.stockMovement.create({
      data: {
        productId,
        createdByUserId,
        type: m.type,
        quantity: m.quantity,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${categories.length} categories, ${users.length} users, ` +
      `${products.length} products, ${expenses.length} expenses, ${movements.length} stock movements.`,
  );
}

/**
 * Returns true when the error indicates the database could not be reached /
 * connected to (as opposed to a data/constraint error).
 */
function isConnectionError(error: unknown): boolean {
  // Prisma initialization errors (P1000 auth, P1001 unreachable, P1002 timeout,
  // P1003 db not found, P1017 server closed connection) all indicate the
  // connection could not be established or was lost.
  const connectionCodes = new Set(['P1000', 'P1001', 'P1002', 'P1003', 'P1017']);
  if (typeof error === 'object' && error !== null) {
    const name = (error as { name?: string }).name;
    const code = (error as { errorCode?: string; code?: string }).errorCode
      ?? (error as { code?: string }).code;
    if (name === 'PrismaClientInitializationError') {
      return true;
    }
    if (typeof code === 'string' && connectionCodes.has(code)) {
      return true;
    }
  }
  return false;
}

async function main(): Promise<void> {
  try {
    // Establish the connection explicitly so connection failures surface here
    // with a clear, dedicated message (Req 13.9).
    await prisma.$connect();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`Seed failed: could not connect to the database. ${detail}`);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }

  try {
    await seed();
  } catch (error) {
    if (isConnectionError(error)) {
      const detail = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error(`Seed failed: database connection error during seeding. ${detail}`);
    } else {
      const detail = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error(`Seed failed: ${detail}`);
    }
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }

  await prisma.$disconnect();
}

void main();