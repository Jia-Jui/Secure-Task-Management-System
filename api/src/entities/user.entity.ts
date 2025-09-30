import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Membership } from './membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToMany(() => Membership, m => m.user)
  memberships: Membership[];
}
