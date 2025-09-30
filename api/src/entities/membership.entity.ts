import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';

@Entity('memberships')
@Unique(['user', 'organization'])
export class Membership {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, u => u.memberships, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Organization, { eager: true, onDelete: 'CASCADE' })
  @Index()
  organization: Organization;

  @Column({ type: 'text' })
  role: Role;
}
