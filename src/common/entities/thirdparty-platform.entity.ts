import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('thirdpartyPlatform')
export class ThirdpartyPlatform {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar', length: 16, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 16, nullable: false, unique: false })
  code: string;

  @Column({ nullable: true, type: 'text' })
  icon: string;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

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
}
