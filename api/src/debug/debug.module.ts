import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { DebugOrgsController } from './orgs.controller';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { Task } from '../entities/task.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Organization, Membership, Task])],
  controllers: [DebugController, DebugOrgsController],
})
export class DebugModule {}
