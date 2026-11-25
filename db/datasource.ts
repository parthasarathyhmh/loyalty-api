import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

export const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    'dist/src/user/entities/client.entity.js',
    'dist/src/wallet/entities/wallet.entity.js',
    'dist/src/wallet/entities/point.entity.js',
    'dist/src/wallet/entities/point-usage.entity.js',
    'dist/src/wallet/entities/point-transaction.entity.js',
    'dist/src/catalog/entities/customer-reward.entity.js',
    'dist/src/catalog/entities/reward-transaction.entity.js',
    'dist/src/checkout/entities/checkout-transaction.entity.js',
    'dist/src/rules/entities/milestone-transactions.entity.js',
    'dist/src/rules/entities/cart-transactions.entity.js',
    'dist/src/rules/entities/rule-snapshot.entity.js',
    'dist/src/rules/entities/throughput-transactions.entity.js',
    'dist/src/common/entities/*.entity.js',
  ],
  synchronize: false,
  migrations: ['dist/db/migrations/*.js'],
};

const datasource = new DataSource(options);

export default datasource;
