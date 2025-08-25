import { pgTable, uuid, text, timestamp, boolean, integer, varchar, AnyPgColumn, PgEnum, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table - matching existing database structure
export const users = pgTable('users', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  password: varchar('password'),
  provider: varchar('provider').default('local'),
  isAdmin: boolean('is_admin').default(false),
  userType: varchar('user_type', { length: 20 }),
  receiveEmailNotification: boolean('receive_email_notification').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (users) => ({
  emailIndex: index('email_idx').on(users.email),
}));

// Providers table - matching existing database structure
export const providers = pgTable('providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  receiveEmailNotification: boolean('receive_email_notification').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Requesters table - matching existing database structure
export const requesters = pgTable('requesters', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  receiveEmailNotification: boolean('receive_email_notification').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Services table - matching existing database structure
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  serviceType: text('service_type').array().notNull(),
  requesterId: uuid('requester_id').references(() => requesters.id),
  providerId: uuid('provider_id').references(() => providers.id),
  status: varchar('status', { length: 20 }).default('PENDENTE').notNull(),
  value: varchar('value'), // Using varchar to match numeric(10,2)
  isMonthlyPackage: boolean('is_monthly_package').default(false),
  isCourtesy: boolean('is_courtesy').default(false),
  creditsUsed: integer('credits_used').default(0),
  images: text('images').array(),
  requestDate: timestamp('request_date').defaultNow().notNull(),
  completionDate: timestamp('completion_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sessions table - matching existing database structure  
export const sessions = pgTable('sessions', {
  sid: varchar('sid').primaryKey(),
  sess: text('sess').notNull(), // jsonb in DB
  expire: timestamp('expire').notNull(),
}, (sessions) => ({
  expireIndex: index('IDX_session_expire').on(sessions.expire),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  userType: z.string().optional(),
});

export const insertProviderSchema = createInsertSchema(providers, {
  name: z.string().min(1),
  email: z.string().email().optional(),
});

export const insertRequesterSchema = createInsertSchema(requesters, {
  name: z.string().min(1),
  email: z.string().email().optional(),
});

export const insertServiceSchema = createInsertSchema(services, {
  serviceType: z.array(z.string()).min(1, "Selecione pelo menos um tipo de serviço"),
  title: z.string().min(1, "Título é obrigatório"),
  isCourtesy: z.boolean().optional(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Requester = typeof requesters.$inferSelect;
export type NewRequester = typeof requesters.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;