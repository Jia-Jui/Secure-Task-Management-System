import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';

@Controller('dev-seed')
export class SeedController {
  constructor(
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(Membership) private mems: Repository<Membership>
  ) {}
  @UseGuards(JwtGuard)
  @Post()
  async seed(@Req() req: any) {
    const org = await this.orgs.save(this.orgs.create({ name: 'Acme' }));
    await this.mems.save(this.mems.create({ user: { id: req.user.sub }, organization: org, role: 'OWNER' as any }));
    return { orgId: org.id };
  }
}
