# Drizzle ORM Best Practices in NestJS

Drizzle ORM is a modern, lightweight, and type-safe TypeScript ORM that pairs exceptionally well with NestJS. Its "SQL-first" philosophy means you can write raw SQL or use its powerful query builder while maintaining full type safety. This document outlines best practices and common usage patterns for integrating Drizzle into a NestJS application.

---

## 1. Best Practices

### a. Module Encapsulation
Encapsulate all Drizzle-related logic within a dedicated NestJS module (e.g., `DrizzleModule`). This module should be responsible for creating the database connection and providing the Drizzle instance to the rest of the application. Making this a `@Global()` module makes the Drizzle service available everywhere without needing to import `DrizzleModule` in every feature module.

### b. Dependency Injection
Use NestJS's dependency injection system to provide the Drizzle instance. Create a custom provider using a factory that instantiates the Drizzle client. This decouples your services from the database connection logic and improves testability.

### c. Schema-Driven Development
Define your database schema using Drizzle's `pgTable`, `mysqlTable`, etc., functions. This schema is the single source of truth for your database structure, enabling Drizzle Kit to generate accurate migrations and providing strong typing for all your queries.

### d. Migrations with Drizzle Kit
Always use `drizzle-kit` for database migrations. It automatically generates SQL migration files by comparing your schema definition to the state of the database. This ensures your database schema evolves safely and predictably.

### e. Configuration Management
Use NestJS's `@nestjs/config` module to manage your database connection string and other environment variables. This keeps sensitive information out of your source code and makes it easy to manage configurations across different environments (development, staging, production).

---

## 2. Setup and Configuration

Here is a step-by-step guide to setting up Drizzle ORM in a NestJS project.

### a. Installation

```bash
# For PostgreSQL
pnpm add drizzle-orm pg dotenv
pnpm add -D drizzle-kit tsx @types/pg
```

### b. Create a DrizzleModule

This example is based on the structure already present in this project.

**`src/database/drizzle.constants.ts`**
```typescript
export const PG_CONNECTION = 'PG_CONNECTION';
```

**`src/database/drizzle.module.ts`**
```typescript
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { PG_CONNECTION } from './drizzle.constants';
import { DatabaseService } from './database.service';

const drizzleProvider: Provider = {
  provide: PG_CONNECTION,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    return drizzle(pool, { schema, logger: true });
  },
};

@Global()
@Module({
  providers: [drizzleProvider, DatabaseService],
  exports: [DatabaseService],
})
export class DrizzleModule {}
```

**`src/database/database.service.ts`**
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { PG_CONNECTION } from './drizzle.constants';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(PG_CONNECTION) public db: NodePgDatabase<typeof schema>,
  ) {}

  // You can expose the raw query builder if needed
  get query() {
    return this.db.query;
  }
}
```

### c. Configure Drizzle Kit

Create a `drizzle.config.ts` file in the project root.

**`drizzle.config.ts`**
```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 3. Common Usage Examples

### a. Schema Definition
Define your tables in the `src/database/schema` directory.

**`src/database/schema/users.ts`**
```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### b. CRUD Operations in a Service

Inject `DatabaseService` into your feature services to perform database operations.

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  // CREATE
  async createUser(name: string, email: string) {
    const [newUser] = await this.databaseService.db
      .insert(users)
      .values({ name, email })
      .returning();
    return newUser;
  }

  // READ ONE
  async findUserById(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  // READ ALL
  async findAllUsers() {
    return this.databaseService.db.select().from(users);
  }

  // UPDATE
  async updateUser(id: number, newName: string) {
    const [updatedUser] = await this.databaseService.db
      .update(users)
      .set({ name: newName })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // DELETE
  async deleteUser(id: number) {
    const [deletedUser] = await this.databaseService.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return deletedUser;
  }
}
```

### c. Querying with Relations (Joins)

If you have a `posts` table with a foreign key to `users`:

```typescript
// Assumes a 'posts' table schema exists
import { posts, users } from '../database/schema';
import { leftJoin, eq } from 'drizzle-orm';

// ... inside a service method

async getPostsWithAuthors() {
  return this.databaseService.db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id));
}
```

---

## 4. Migrations

### a. Generate Migrations
After changing your schema files, generate a new migration.

```bash
pnpm drizzle-kit generate
```
This command creates a new SQL file in the output directory specified in `drizzle.config.ts` (e.g., `./drizzle`).

### b. Apply Migrations
Create a simple script to run your migrations.

**`scripts/migrate.ts`**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const runMigrations = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed successfully!');
  await pool.end();
};

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

Add a script to your `package.json`:
```json
"scripts": {
  "db:migrate": "tsx scripts/migrate.ts"
}
```

Now you can apply migrations by running:
```bash
pnpm db:migrate
```
