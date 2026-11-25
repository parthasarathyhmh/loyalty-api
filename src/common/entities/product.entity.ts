import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Workspace } from './workspace.entity';

@Entity('products')
@Unique(['sku'])
export class Products {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Workspace, { nullable: false })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', nullable: false })
  sku: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  heroName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  packaging: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  preservative: string;

  @Column({ type: 'int', nullable: false })
  entityId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand: string;

  @Column({ type: 'smallint', nullable: true })
  featured: number;

  @Column({ type: 'smallint', nullable: true })
  recommended: number;

  @Column({ type: 'smallint', nullable: true })
  isNew: number;

  @Column({ type: 'smallint', nullable: true })
  topselling: number;

  @Column({ type: 'smallint', nullable: false })
  status: number;

  @Column({ type: 'text', nullable: true })
  allergens: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  alternativeUom: string;

  @Column({
    type: 'varchar',
    nullable: true,
    array: true,
  })
  categoryIds: string[];

  @Column({ type: 'varchar', nullable: true, array: true })
  categoryNames: string[];

  @Column({
    type: 'varchar',
    nullable: true,
    array: true,
  })
  segmentIds: string[];

  @Column({ type: 'varchar', nullable: true, array: true })
  customerSegment: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @Column({ type: 'text', nullable: true })
  nutritionFacts: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storageAndDistribution: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  denominatorAuomToBuom: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  salesOrg: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  distributionChannel: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  division: string;

  @Column({ type: 'int', nullable: false })
  websiteId: number;
}
