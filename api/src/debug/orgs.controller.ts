import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { JwtGuard } from '../auth/jwt.guard';

@UseGuards(JwtGuard) // require a valid JWT
@Controller('debug/orgs')
export class DebugOrgsController {
  constructor(
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
  ) {}

  @Get()
  async list() {
    return this.orgs.find({ relations: ['parent'] });
  }

  @Post()
  async create(@Body() dto: { name: string; parentId?: number }) {
    const parent = dto.parentId
      ? await this.orgs.findOne({ where: { id: dto.parentId } })
      : undefined;
    const org = this.orgs.create({ name: dto.name, parent: parent ?? null });
    return this.orgs.save(org);
  }
}
