import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Products } from './product.entity';
import { RoleProjectMapping } from './role-project-mapping.entity';
import { Workspace } from './workspace.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Workspace, (workspace) => workspace.projects, {
    nullable: false,
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 16, unique: true, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'jsonb', nullable: false })
  locale: Record<string, any>;

  @Column({ type: 'varchar', length: 16, nullable: false })
  defaultLocale: string;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 64, nullable: false })
  name: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'hstore', nullable: true })
  configurations?: Record<string, string>;

  @OneToMany(() => Customer, (customer) => customer.project)
  customers: Customer[];

  @OneToMany(() => Products, (products) => products.project)
  products: Products[];

  @OneToMany(() => RoleProjectMapping, (role) => role.project)
  roleProjectMapping: RoleProjectMapping[];
}
