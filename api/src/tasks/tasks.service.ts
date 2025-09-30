import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasks: Repository<Task>,
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async list(orgId: number) {
    return this.tasks.find({ where: { organization: { id: orgId } }, order: { position: 'ASC', id: 'ASC' } });
  }

  async create(orgId: number, creatorId: number, dto: { title: string; description?: string; category?: string }) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Org not found');
    const creator = await this.users.findOne({ where: { id: creatorId } });
    const position = (await this.tasks.count({ where: { organization: { id: orgId } } })) + 1;
    return this.tasks.save(this.tasks.create({ ...dto, organization: org, creator, position }));
  }

  async update(id: number, dto: Partial<Pick<Task,'title'|'description'|'status'|'category'|'position'>>) {
    const t = await this.tasks.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    Object.assign(t, dto);
    return this.tasks.save(t);
  }

  async remove(id: number) {
    const t = await this.tasks.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    await this.tasks.remove(t);
    return { success: true };
  }
}
