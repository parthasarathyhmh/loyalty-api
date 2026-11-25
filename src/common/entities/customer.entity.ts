import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Customermeta } from './customer-meta.entity';
import { Project } from './project.entity';
import { Workspace } from './workspace.entity';

@Entity('customers')
@Unique(['customerId'])
export class Customer {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Workspace, { nullable: false })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'int', nullable: false })
  tierId: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  group: string;

  @Column({
    type: 'varchar',
    nullable: true,
    array: true,
  })
  segmentIds: string[];

  @Column({ type: 'varchar', nullable: true, array: true })
  segments: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'int', nullable: false })
  customerId: number;

  @Column({ type: 'int', nullable: false })
  companyEntityId: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  mobile: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  dtCode: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  salesOrganization: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  distributionChannel: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  division: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  retailerCode: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  companyName: string;

  @Column({ type: 'text', nullable: false })
  addressStreet: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  addressCity: string;

  @Column({ type: 'varchar', length: 25, nullable: false })
  addressCountry: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  addressState: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  addressZipcode: string;

  @Column({ type: 'smallint', nullable: false })
  isActive: number;

  @Column({ type: 'varchar', length: 25, nullable: true })
  territory: string;

  @Column({ type: 'int', nullable: false })
  companyAdminId: number;

  @Column({ type: 'varchar', length: 10, nullable: false })
  paymentType: string;

  @Column({ type: 'int', nullable: false })
  websiteId: number;

  @Column({ type: 'smallint', nullable: false })
  companyStatus: number;

  @Column({ type: 'json', nullable: false })
  meta: Record<string, any>;

  @OneToOne(() => Customermeta, (meta) => meta.customer, { cascade: true })
  customerMeta: Customermeta;
}
