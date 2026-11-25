import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  Consumer,
  ConsumerType,
} from '../common/decorators/consumer.decorator';
import { MachineGuard } from '../common/guards/machine.guard';
import { ThirdPartyService } from './thirdparty.service';

@Controller('thirdparty')
export class ThirdPartyController {
  constructor(private readonly service: ThirdPartyService) {}

  @Get('yalo/balance/:retailerCode')
  @Consumer(ConsumerType.YALO)
  @UseGuards(MachineGuard)
  async getStoreBalance(
    @Param('retailerCode') retailerCode: string,
  ): Promise<{ activePoints: number }> {
    return this.service.balance(retailerCode);
  }
}
