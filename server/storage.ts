import {
  users,
  requesters,
  providers,
  services,
  type User,
  type NewUser,
  type Requester,
  type NewRequester,
  type Provider,
  type NewProvider,
  type Service,
  type NewService,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import bcrypt from 'bcryptjs';

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: NewUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPermissions(id: string, isAdmin: boolean, userType?: string): Promise<User>;

  // Requester operations
  getRequesters(): Promise<Requester[]>;
  getAllRequesters(): Promise<Requester[]>;
  getRequester(id: string): Promise<Requester | undefined>;
  createRequester(requester: NewRequester): Promise<Requester>;
  updateRequester(id: string, requester: Partial<NewRequester>): Promise<Requester>;
  deleteRequester(id: string): Promise<void>;

  // Provider operations
  getProviders(): Promise<Provider[]>;
  getAllProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | undefined>;
  createProvider(provider: NewProvider): Promise<Provider>;
  updateProvider(id: string, provider: Partial<NewProvider>): Promise<Provider>;
  deleteProvider(id: string): Promise<void>;

  // Service operations
  getServices(filters?: { status?: string; month?: number; year?: number }): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: NewService): Promise<Service>;
  updateService(id: string, service: Partial<NewService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  getMonthlyServiceCount(month: number, year: number): Promise<number>;
  getMonthlyStats(month: number, year: number): Promise<{
    total: number;
    pending: number;
    resolved: number;
    canceled: number;
    totalValue: number;
    creditsUsed: number;
  }>;
  getRecentServices(limit: number): Promise<Service[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: NewUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserPermissions(id: string, isAdmin: boolean, userType?: string): Promise<User> {
    const result = await db
      .update(users)
      .set({
        isAdmin,
        userType,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createUser(email: string, password: string, userType: string, firstName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        firstName: firstName || email.split('@')[0],
        lastName: '',
        isAdmin: false,
        userType,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Requester operations
  async getRequesters(): Promise<Requester[]> {
    return await db.select().from(requesters).orderBy(desc(requesters.createdAt));
  }

  async getAllRequesters(): Promise<Requester[]> {
    return await db.select().from(requesters).orderBy(desc(requesters.createdAt));
  }

  async getRequester(id: string): Promise<Requester | undefined> {
    const [requester] = await db.select().from(requesters).where(eq(requesters.id, id));
    return requester;
  }

  async createRequester(requester: NewRequester): Promise<Requester> {
    const [newRequester] = await db.insert(requesters).values(requester).returning();
    return newRequester;
  }

  async updateRequester(id: string, requester: Partial<NewRequester>): Promise<Requester> {
    const [updatedRequester] = await db
      .update(requesters)
      .set({ ...requester, updatedAt: new Date() })
      .where(eq(requesters.id, id))
      .returning();
    return updatedRequester;
  }

  async deleteRequester(id: string): Promise<void> {
    await db.delete(requesters).where(eq(requesters.id, id));
  }

  // Provider operations
  async getProviders(): Promise<Provider[]> {
    return await db.select().from(providers).orderBy(desc(providers.createdAt));
  }

  async getAllProviders(): Promise<Provider[]>{
    return await db.select().from(providers).orderBy(desc(providers.createdAt));
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async createProvider(provider: NewProvider): Promise<Provider> {
    const [newProvider] = await db.insert(providers).values(provider).returning();
    return newProvider;
  }

  async updateProvider(id: string, provider: Partial<NewProvider>): Promise<Provider> {
    const [updatedProvider] = await db
      .update(providers)
      .set({ ...provider, updatedAt: new Date() })
      .where(eq(providers.id, id))
      .returning();
    return updatedProvider;
  }

  async deleteProvider(id: string): Promise<void> {
    await db.delete(providers).where(eq(providers.id, id));
  }

  // Service operations
  async getServices(filters?: { status?: string; month?: number; year?: number }): Promise<Service[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(services.status, filters.status));
    }

    if (filters?.month && filters?.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      conditions.push(
        and(
          gte(services.requestDate, startDate),
          lte(services.requestDate, endDate)
        )
      );
    }

    let query = db.select().from(services);

    if (conditions.length > 0) {
      return await db.select().from(services).where(and(...conditions)).orderBy(desc(services.createdAt));
    }

    return await db.select().from(services).orderBy(desc(services.createdAt));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: NewService): Promise<Service> {
    // Convert string dates to Date objects
    const serviceData = {
      ...service,
      requestDate: service.requestDate ? new Date(service.requestDate) : new Date(),
      completionDate: service.completionDate ? new Date(service.completionDate) : undefined,
      value: service.value ? service.value : undefined,
    };

    const [newService] = await db.insert(services).values(serviceData).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<NewService>): Promise<Service> {
    // Convert string dates to Date objects
    const serviceData = {
      ...service,
      requestDate: service.requestDate ? new Date(service.requestDate) : undefined,
      completionDate: service.completionDate ? new Date(service.completionDate) : undefined,
      updatedAt: new Date(),
    };

    const [updatedService] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getMonthlyServiceCount(month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await db
      .select()
      .from(services)
      .where(
        and(
          gte(services.requestDate, startDate),
          lte(services.requestDate, endDate),
          eq(services.isMonthlyPackage, true)
        )
      );

    return result.reduce((total, service) => total + (service.creditsUsed || 0), 0);
  }

  async getMonthlyStats(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyServices = await db
      .select()
      .from(services)
      .where(
        and(
          gte(services.requestDate, startDate),
          lte(services.requestDate, endDate)
        )
      );

    const stats = {
      total: monthlyServices.length,
      pending: monthlyServices.filter(s => s.status === 'pending').length,
      resolved: monthlyServices.filter(s => s.status === 'resolved').length,
      canceled: monthlyServices.filter(s => s.status === 'canceled').length,
      totalValue: monthlyServices.reduce((sum, s) => sum + parseFloat(s.value || '0'), 0),
      creditsUsed: monthlyServices
        .filter(s => s.isMonthlyPackage)
        .reduce((sum, s) => sum + (s.creditsUsed || 0), 0),
    };

    return stats;
  }

  async getRecentServices(limit: number = 3): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.status, 'resolved'))
      .orderBy(desc(services.completionDate))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();