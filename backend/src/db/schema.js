import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
  date,
  decimal,
  text,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

// ============================================================
// 1. roles — tidak ada dependency
// ============================================================
export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  name: mysqlEnum('name', ['ADMIN', 'SEKRETARIS', 'BENDAHARA', 'SISWA'])
    .notNull()
    .unique(),
});

// ============================================================
// 2. users — depends on roles
// ============================================================
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  roleId: int('role_id')
    .notNull()
    .references(() => roles.id),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  passwordChangedAt: timestamp('password_changed_at'),
  lastPasswordResetBy: int('last_password_reset_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// ============================================================
// 3. students — depends on users
// ============================================================
export const students = mysqlTable('students', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id')
    .unique()
    .references(() => users.id),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  gender: mysqlEnum('gender', ['L', 'P']).notNull(),
  phone: varchar('phone', { length: 20 }),
  status: mysqlEnum('status', ['ACTIVE', 'INACTIVE']).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// ============================================================
// 4. attendance_days — depends on users
// ============================================================
export const attendanceDays = mysqlTable('attendance_days', {
  id: int('id').autoincrement().primaryKey(),
  openedBy: int('opened_by')
    .notNull()
    .references(() => users.id),
  date: date('date').notNull().unique(),
  status: mysqlEnum('status', ['OPEN', 'CLOSED']).notNull().default('OPEN'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// ============================================================
// 5. attendance_details — depends on attendance_days, students
// ============================================================
export const attendanceDetails = mysqlTable(
  'attendance_details',
  {
    id: int('id').autoincrement().primaryKey(),
    attendanceDayId: int('attendance_day_id')
      .notNull()
      .references(() => attendanceDays.id),
    studentId: int('student_id')
      .notNull()
      .references(() => students.id),
    status: mysqlEnum('status', ['HADIR', 'IZIN', 'SAKIT', 'ALPHA'])
      .notNull()
      .default('HADIR'),
    reason: varchar('reason', { length: 255 }),
    specialNote: varchar('special_note', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex('attendance_details_attendance_day_id_student_id_unique').on(
      table.attendanceDayId,
      table.studentId
    ),
    index('idx_student').on(table.studentId),
  ]
);

// ============================================================
// 6. cash_periods — tidak ada dependency
// ============================================================
export const cashPeriods = mysqlTable(
  'cash_periods',
  {
    id: int('id').autoincrement().primaryKey(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    dueDate: date('due_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex('cash_periods_start_date_end_date_unique').on(
      table.startDate,
      table.endDate
    ),
  ]
);

// ============================================================
// 7. cash_payments — depends on students, cash_periods, users
// ============================================================
export const cashPayments = mysqlTable(
  'cash_payments',
  {
    id: int('id').autoincrement().primaryKey(),
    studentId: int('student_id')
      .notNull()
      .references(() => students.id),
    periodId: int('period_id')
      .notNull()
      .references(() => cashPeriods.id),
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
    paymentDate: date('payment_date').notNull(),
    receivedBy: int('received_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cash_payments_student_id_period_id_unique').on(
      table.studentId,
      table.periodId
    ),
  ]
);

// ============================================================
// 8. cash_transactions — depends on users, cash_payments
// ============================================================
export const cashTransactions = mysqlTable(
  'cash_transactions',
  {
    id: int('id').autoincrement().primaryKey(),
    type: mysqlEnum('type', ['INCOME', 'EXPENSE']).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    createdBy: int('created_by')
      .notNull()
      .references(() => users.id),
    referencePaymentId: int('reference_payment_id').references(
      () => cashPayments.id
    ),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index('idx_deleted_at').on(table.deletedAt),
  ]
);