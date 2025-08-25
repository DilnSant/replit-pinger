import bcrypt from 'bcrypt';
import { db } from '../server/db'; // correto
import { users } from '../shared/schema'; // corrigido
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  const adminEmail = 'admin@brandness.com';
  const adminExists = await db.select().from(users).where(eq(users.email, adminEmail));

  if (adminExists.length > 0) {
    console.log('Usuário admin já existe.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await db.insert(users).values({
    nome: 'Administrador',
    email: adminEmail,
    senha: hashedPassword,
    is_admin: true,
  });

  console.log('Usuário admin criado com sucesso!');
}

seedAdmin().catch((err) => {
  console.error('Erro ao inserir admin:', err);
});
