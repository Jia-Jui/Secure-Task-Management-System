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
    if (!perm) return true;

    const resourceOrgId = await this.resolveOrgScope(req);
    if (!resourceOrgId) throw new ForbiddenException('Organization scope required');

    const org = await this.orgs.findOne({ where: { id: resourceOrgId }, relations: ['parent'] });
    const candidateOrgIds = [org?.id, org?.parent?.id].filter(Boolean) as number[];

    const membership = await this.memberships.findOne({
      where: { organization: { id: In(candidateOrgIds) }, user: { id: userId } },
      order: { id: 'ASC' },
    });

    const role = membership?.role as Role | undefined;
    if (!role || !hasPermission(role, perm)) throw new ForbiddenException('Insufficient permission');
    return true;
  }

  private async resolveOrgScope(req: any): Promise<number | undefined> {
    // 1) If :id exists (PUT/DELETE /tasks/:id), infer org from the task itself
    const id = Number(req.params?.id ?? NaN);
    if (Number.isFinite(id)) {
      const t = await this.tasks.findOne({ where: { id }, relations: ['organization'] });
      if (t?.organization?.id) return t.organization.id;
    }
    // 2) Fallback to explicit orgId in query/body (GET/POST etc.)
    const explicit = Number(req.query?.orgId ?? req.body?.orgId ?? NaN);
    return Number.isFinite(explicit) ? explicit : undefined;
  }
}
