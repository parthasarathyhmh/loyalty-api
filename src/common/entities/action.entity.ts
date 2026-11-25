import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('actions')
export class Actions {
  @PrimaryGeneratedColumn('increment')
  actionId: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  actionName: string;
}
