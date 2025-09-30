import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Organization, { eager: true, onDelete: 'CASCADE' })
  @Index()
  organization: Organization;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  creator?: User | null;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', default: 'todo' })
  status: TaskStatus;

  @Column({ length: 32, default: 'General' })
  category: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
