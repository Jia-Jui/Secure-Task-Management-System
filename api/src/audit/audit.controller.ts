import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { RequirePermission } from '@turbovets/auth';

@UseGuards(JwtGuard, RbacGuard)
@Controller('audit-log')
export class AuditController {
  @Get()
  @RequirePermission('audit:read')
  list() {
    return { info: 'Audit logs are written to server console in dev.' };
  }
}
