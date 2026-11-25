import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from '../wallet/entities/point.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ThirdPartyController } from './thirdparty.controller';
import { ThirdPartyService } from './thirdparty.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Point])],
  controllers: [ThirdPartyController],
  providers: [ThirdPartyService],
})
export class ThirdPartyModule {}
