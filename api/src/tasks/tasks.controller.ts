import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { RequirePermission } from '@turbovets/auth';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@UseGuards(JwtGuard, RbacGuard)
@Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}

  @Get()
  @RequirePermission('tasks:read')
  list(@Query('orgId') orgId: number) {
    return this.svc.list(Number(orgId));
  }

  @Post()
  @RequirePermission('tasks:create')
  create(@Body() body: CreateTaskDto, @Req() req: any) {
    return this.svc.create(body.orgId, req.user.sub, body);
  }

  @Put(':id')
  @RequirePermission('tasks:update')
  update(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.svc.update(Number(id), body);
  }

  @Delete(':id')
  @RequirePermission('tasks:delete')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
