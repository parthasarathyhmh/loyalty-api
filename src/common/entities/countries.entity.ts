import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'countries' })
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'country_name', type: 'varchar', length: 100 })
  countryName: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode: string;

  @Column({ name: 'iso_code', type: 'char', length: 3 })
  isoCode: string;

  @Column({ name: 'capital', type: 'varchar', length: 100, nullable: true })
  capital: string;

  @Column({ name: 'population', type: 'integer', nullable: true })
  population: number;

  @Column({
    name: 'area',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  area: number;

  @Column({ name: 'continent', type: 'varchar', length: 50, nullable: true })
  continent: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
