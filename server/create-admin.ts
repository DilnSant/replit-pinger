
import { db } from './db';
import { users } from '@shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  try {
    const adminEmail = 'admin@brandness.com';
    
    // Check if admin already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await db.insert(users).values({
      name: 'Administrador',
      email: adminEmail,
      password: hashedPassword,
      userType: 'admin',
      provider: 'local',
      isActive: true,
    }).returning();

    console.log('Admin user created successfully:', admin[0]);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();
