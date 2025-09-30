import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Task } from '../entities/task.entity';
import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

import { JwtGuard } from '../auth/jwt.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { AuthModule } from '../auth/auth.module';   // <-- add this

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Membership, Organization, User]),
    AuthModule,                                      // <-- and this
  ],
  controllers: [TasksController],
  providers: [TasksService, JwtGuard, RbacGuard],
})
export class TasksModule {}
