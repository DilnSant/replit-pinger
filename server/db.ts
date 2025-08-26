
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Lazy initialization of Supabase client
let _supabase: any = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;

  // Get Supabase configuration from environment variables
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log('Attempting to connect to Supabase...');
  console.log('SUPABASE_URL length:', supabaseUrl?.length || 0);
  console.log('SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey?.length || 0);

  // Ensure Supabase credentials are provided and not empty
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === '' || supabaseServiceKey === '') {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided and not empty');
    console.error('SUPABASE_URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'empty/undefined');
    console.error('SUPABASE_SERVICE_ROLE_KEY value:', supabaseServiceKey ? 'present but hidden' : 'empty/undefined');
    console.error('Available Supabase env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    throw new Error('Supabase credentials must be provided and not empty');
  }

  try {
    // Initialize Supabase client for backend operations
    _supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized successfully');
    return _supabase;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
}

// Export lazy-loaded supabase client
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});

// Database health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const startTime = Date.now();
    // Check if services table exists and is accessible
    const { data, error } = await supabase.from('services').select('id').limit(1);
    
    if (error) throw error;
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [Supabase] Connection successful (${responseTime}ms)`);
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Connection failed:', error);
    return false;
  }
}

// Combined health check function
export async function checkAllConnections(): Promise<{
  database: boolean;
  supabase: boolean;
  responseTime: string;
  timestamp: string;
  details: {
    supabaseUrl: string;
    hasServiceKey: boolean;
    memoryUsage: number;
  };
}> {
  const startTime = Date.now();
  const dbHealth = await checkDatabaseConnection();
  
  // Evitar dupla verificação - supabase e database são a mesma coisa aqui
  const supabaseHealth = dbHealth;
  const responseTime = Date.now() - startTime;
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  return {
    database: dbHealth,
    supabase: supabaseHealth,
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString(),
    details: {
      supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + '...' || 'not-set',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      memoryUsage: memUsage
    }
  };
}

// Lazy initialization of Drizzle ORM
let _db: any = null;

function getDrizzleClient() {
  if (_db) return _db;

  try {
    // Get Supabase configuration from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      // Use DATABASE_URL if available
      const client = postgres(databaseUrl, {
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
      _db = drizzle(client, { schema });
      console.log('✅ [Drizzle ORM] Database connection initialized with DATABASE_URL');
    } else if (supabaseUrl && supabaseServiceKey) {
      // Convert Supabase URL to connection string
      const url = new URL(supabaseUrl);
      const connectionString = `postgresql://postgres.${url.hostname.split('.')[0]}:${supabaseServiceKey}@${url.hostname}:5432/postgres`;
      
      // Create postgres client
      const client = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
      
      // Create Drizzle instance
      _db = drizzle(client, { schema });
      console.log('✅ [Drizzle ORM] Database connection initialized with Supabase credentials');
    } else {
      console.warn('⚠️ [Drizzle ORM] No credentials provided, using fallback');
      _db = null;
    }
  } catch (error) {
    console.error('❌ [Drizzle ORM] Failed to initialize:', error);
    _db = null;
  }

  return _db;
}

// Export lazy-loaded Drizzle client
export const db = new Proxy({}, {
  get(target, prop) {
    const client = getDrizzleClient();
    if (!client) {
      throw new Error('Database client not available');
    }
    return client[prop];
  }
});
