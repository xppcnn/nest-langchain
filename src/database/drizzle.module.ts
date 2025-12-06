import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';
import { DatabaseService } from './database.service';
import { DRIZZLE } from './drizzle.constants';
import { ConfigService } from '@nestjs/config';
export { DRIZZLE };

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is not set');
        }
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
    DatabaseService,
  ],
  exports: [DRIZZLE, DatabaseService],
})
export class DrizzleModule {}
