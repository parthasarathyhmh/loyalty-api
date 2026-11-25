import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('modules')
export class Modules {
  @PrimaryGeneratedColumn('increment')
  moduleId: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  moduleName: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  parentModule: string;

  @Column({ type: 'int', nullable: false })
  parentModulePriority: number;

  @Column({ type: 'int', nullable: false })
  subModulePriority: number;
}
