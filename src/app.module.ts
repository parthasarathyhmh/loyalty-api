import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { options } from '../db/datasource';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { CmsSectionsModule } from './cms-sections/cms-sections.module';
import { getLogConfig } from './common/configs/logger.config';
import { getValidationConfig } from './common/configs/validation.config';
import { HealthModule } from './health/health.module';
import { MilestoneModule } from './milestone/milestone.module';
import { RuleModule } from './rules/rule.module';
import { ThirdPartyModule } from './thridparty/thridparty.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(options),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validationOptions: getValidationConfig(),
    }),
    LoggerModule.forRoot({ pinoHttp: getLogConfig() }),
    ScheduleModule.forRoot(),
    HealthModule,
    UserModule,
    CatalogModule,
    WalletModule,
    MilestoneModule,
    CheckoutModule,
    RuleModule,
    CmsSectionsModule,
    ThirdPartyModule,
  ],
})
export class AppModule {}
