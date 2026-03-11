import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 10);

  await knex('users').insert([
    {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
    },
    {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
    },
  ]);
}
