import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SeedController } from './seed.controller';
import { DevMembersController } from './dev-members.controller';

import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity'; // <-- add this

const devControllers =
  process.env.NODE_ENV !== 'production'
    ? [SeedController, DevMembersController]
    : [];

@Module({
  imports: [
    ConfigModule,
    // Add Task so RbacGuard can inject TaskRepository in this module context
    TypeOrmModule.forFeature([User, Membership, Organization, Task]),
    // (No JwtModule here — you're using the global Jwt in AppModule)
  ],
  providers: [AuthService],
  controllers: [AuthController, ...devControllers],
  exports: [AuthService],
})
export class AuthModule {}
