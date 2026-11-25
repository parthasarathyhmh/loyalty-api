import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserEntity } from '../common/interfaces/user';
import { AuthDto, AuthResponse } from './dtos/auth.dto';
import { ProfileResponse } from './dtos/profile.dto';
import { UserService } from './user.service';
import { TierResponse } from './dtos/tier-response.dto';
import { Consumer, ConsumerType } from '@/common/decorators/consumer.decorator';
import { MachineGuard } from '@/common/guards/machine.guard';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('auth')
  async authenticate(@Body() body: AuthDto): Promise<AuthResponse> {
    return this.service.authenticate(body.token, body.clientId);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async profile(@User() user: UserEntity): Promise<ProfileResponse> {
    return this.service.profile(user);
  }

  @Get('tiers')
  @UseGuards(AuthGuard)
  async getTierInfo(@User() user: UserEntity): Promise<TierResponse> {
    return this.service.getTierInfo(user);
  }

  @Get('tier-data/:retailerCode')
  @Consumer(ConsumerType.MAGENTO)
  @UseGuards(MachineGuard)
  async getTierData(@Param('retailerCode') retailerCode: string) {
    return await this.service.getTierData(retailerCode);
  }
}
