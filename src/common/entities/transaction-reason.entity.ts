import { Project } from '@/common/entities/project.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('reasons')
  export class Reason {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Project, (project) => project.id)
    project: Project;
  
    @Column('varchar')
    code: string;
  
    @Column('varchar')
    reason: string;
  
    @Column('varchar')
    description: string;
  
    @Column('numeric')
    min: number;
  
    @Column('numeric')
    max: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  