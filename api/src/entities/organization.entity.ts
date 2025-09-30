import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  name: string;

  @ManyToOne(() => Organization, o => o.children, { nullable: true, onDelete: 'SET NULL' })
  parent?: Organization | null;

  @OneToMany(() => Organization, o => o.parent)
  children: Organization[];
}
