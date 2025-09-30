import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtGuard } from './jwt.guard';
import { RbacGuard } from './rbac.guard';
import { RequirePermission } from '@turbovets/auth';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';

type Role = 'OWNER' | 'ADMIN' | 'VIEWER';

@UseGuards(JwtGuard, RbacGuard)
@Controller('dev/memberships')
export class DevMembersController {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(Membership) private mems: Repository<Membership>
  ) {}

  // Assign or update a role for a user in an org
  @Post()
  @RequirePermission('audit:read') // Owner/Admin allowed
  async upsert(
    @Body() body: { email: string; orgId: number; role: Role }
  ) {
    const { email, orgId, role } = body;
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new Error(`User not found: ${email}`);

    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new Error(`Org not found: ${orgId}`);

    let mem = await this.mems.findOne({
      where: { user: { id: user.id }, organization: { id: org.id } },
    });

    if (!mem) {
      mem = this.mems.create({ user, organization: org, role });
    } else {
      mem.role = role;
    }

    await this.mems.save(mem);
    return { ok: true, userId: user.id, orgId: org.id, role: mem.role };
  }

  // Quick list (dev)
  @Get()
  @RequirePermission('audit:read')
  list(@Query('orgId') orgId: number) {
    return this.mems.find({ where: { organization: { id: Number(orgId) } } });
  }
}
