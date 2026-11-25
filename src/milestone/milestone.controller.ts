import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserEntity } from '../common/interfaces/user';
import { MilestoneResponse } from './dtos/milestone.dto';
import { MilestoneService } from './milestone.service';

@Controller('milestones')
export class MilestoneController {
  constructor(private readonly service: MilestoneService) {}

  @Get()
  @UseGuards(AuthGuard)
  async listMilestones(@User() user: UserEntity): Promise<MilestoneResponse> {
    return this.service.listMilestones(user);
  }
}
