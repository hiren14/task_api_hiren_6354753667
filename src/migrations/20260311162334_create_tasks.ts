import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table
      .enum('status', ['pending', 'in_progress', 'completed'])
      .notNullable()
      .defaultTo('pending');
    table.timestamp('completed_at').nullable();
    table.timestamp('deleted_at').nullable(); // soft delete
    table.timestamps(true, true); // created_at, updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tasks');
}
