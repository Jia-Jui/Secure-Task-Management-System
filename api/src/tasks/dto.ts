import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsInt() orgId!: number;
  @IsString() @MaxLength(180) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: 'todo'|'in_progress'|'done';
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsInt() position?: number;
}
