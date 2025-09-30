import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Reflector } from '@nestjs/core';

import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';

import { hasPermission, Permission, Role, REQ_PERM } from '@turbovets/auth';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: number | undefined = req.user?.sub;
    if (!userId) return false;

    const perm = this.reflector.get<Permission>(REQ_PERM, ctx.getHandler());
    if (!perm) return true; // public route or no specific permission required

    // Determine route context
    const taskId = Number(req.params?.id ?? NaN);
    const isUpdate = perm === 'tasks:update' && Number.isFinite(taskId);
    const isDelete = perm === 'tasks:delete' && Number.isFinite(taskId);

    // Load target task (only as much as we need)
    let targetTask: Task | undefined;
    if (isDelete) {
      targetTask = await this.tasks.findOne({
        where: { id: taskId },
        relations: ['organization', 'creator'],
      });
    } else if (isUpdate) {
      targetTask = await this.tasks.findOne({
        where: { id: taskId },
        relations: ['organization'],
      });
    }

    // Resolve org scope (prefer task’s org, else explicit orgId from query/body)
    const resourceOrgId =
      targetTask?.organization?.id ?? this.resolveExplicitOrgId(req);

    if (!resourceOrgId) {
      throw new ForbiddenException('Organization scope required');
    }

    // Consider org and its immediate parent (2-level hierarchy)
    const org = await this.orgs.findOne({ where: { id: resourceOrgId }, relations: ['parent'] });
    const candidateOrgIds = [org?.id, org?.parent?.id].filter(Boolean) as number[];

    // Find membership for this user in the candidate orgs
    const membership = await this.memberships.findOne({
      where: { organization: { id: In(candidateOrgIds) }, user: { id: userId } },
      order: { id: 'ASC' },
    });

    const role = membership?.role as Role | undefined;
    if (!role || !hasPermission(role, perm)) {
      throw new ForbiddenException('Insufficient permission');
    }

    // Ownership rule: Owners may only DELETE tasks they created
    if (isDelete && role === 'OWNER') {
      const creatorId = targetTask?.creator?.id;
      if (!creatorId || creatorId !== userId) {
        throw new ForbiddenException('Owners can only delete their own tasks');
      }
    }

    return true;
  }

  private resolveExplicitOrgId(req: any): number | undefined {
    const id = Number(req.query?.orgId ?? req.body?.orgId ?? NaN);
    return Number.isFinite(id) ? id : undefined;
  }
}
