import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtGuard } from '../auth/jwt.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { RequirePermission } from '@turbovets/auth';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { Task } from '../entities/task.entity';

@UseGuards(JwtGuard, RbacGuard)
@Controller('debug')
export class DebugController {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(Membership) private mems: Repository<Membership>,
    @InjectRepository(Task) private tasks: Repository<Task>,
  ) {}

  @Get('users') @RequirePermission('audit:read') listUsers() { return this.users.find(); }
  @Get('orgs')  @RequirePermission('audit:read') listOrgs()  { return this.orgs.find({ relations: ['parent'] }); }
  @Get('mems')  @RequirePermission('audit:read') listMems()  { return this.mems.find(); }
  @Get('tasks') @RequirePermission('audit:read') listTasks() { return this.tasks.find({ order: { position: 'ASC', id: 'ASC' } }); }
}
