import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditController } from './audit.controller';
import { AuditMiddleware } from './audit.middleware';

import { JwtGuard } from '../auth/jwt.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { AuthModule } from '../auth/auth.module';

import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';

@Module({
  // bring AuthService into this module's DI context,
  // and provide repos needed by RbacGuard
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Membership, Organization, Task]),
  ],
  controllers: [AuditController],
  providers: [JwtGuard, RbacGuard],
})
export class AuditModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
