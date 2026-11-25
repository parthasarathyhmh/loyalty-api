import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { PageDto } from '../common/dtos/pagination.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserEntity } from '../common/interfaces/user';
import { WalletRewardResponse } from './dtos/reward.dto';
import {
  TransactionFilterDto,
  TransactionsResponse,
} from './dtos/transaction.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get('rewards')
  @UseGuards(AuthGuard)
  async rewards(@User() user: UserEntity): Promise<WalletRewardResponse> {
    return this.service.walletRewards(user);
  }

  @Get('transactions')
  @UseGuards(AuthGuard)
  async transactions(
    @User()
    user: UserEntity,
    @Query()
    filter: TransactionFilterDto,
    @Query()
    page: PageDto,
  ): Promise<TransactionsResponse> {
    return this.service.transactions(user, filter, page);
  }
}
