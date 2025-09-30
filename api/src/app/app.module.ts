import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { Task } from '../entities/task.entity';

import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';
import { DebugModule } from '../debug/debug.module';


@Module({
  imports: [
    // Explicitly load .env from workspace root
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'sqlite',
        database: cfg.get<string>('DB_FILE') ?? './dev.db',
        entities: [User, Organization, Membership, Task],
        synchronize: true,
      }),
    }),

    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');
        // dev fallback so you don’t crash if .env wasn’t picked up
        return {
          secret: secret ?? 'DEV_FALLBACK_SECRET_CHANGE_ME',
          signOptions: { expiresIn: '2h' },
        };
      },
    }),

    AuthModule,
    TasksModule,
    AuditModule,
    DebugModule,
  ],
})
export class AppModule {}
