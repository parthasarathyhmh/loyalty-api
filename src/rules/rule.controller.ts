import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Consumer,
  ConsumerType,
} from '../common/decorators/consumer.decorator';
import { MachineGuard } from '../common/guards/machine.guard';
import { ApplyDto, PreviewDto } from './dtos/client.dto';
import { Preview } from './dtos/preview.dto';
import { RuleService } from './rule.service';
import { TierService } from './tier.service';

@Controller('rules')
export class RuleController {
  constructor(
    private readonly rules: RuleService,
    private readonly tiers: TierService,
  ) {}

  @Post('cart/preview')
  @Consumer(ConsumerType.HSF_MX)
  @UseGuards(MachineGuard)
  async getRuleProcessCreditPoint(@Body() dto: PreviewDto): Promise<Preview> {
    return this.rules.evaluateCartRule(dto);
  }

  @Post('cart/apply')
  @Consumer(ConsumerType.HSF_MX)
  @UseGuards(MachineGuard)
  async processCartRuleCreditPoints(
    @Body() applyDto: ApplyDto,
  ): Promise<number> {
    return this.rules.applyCartRule(applyDto);
  }

  // tier in cron
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleDailyTierUpdate(): Promise<void> {
    return this.tiers.processActiveProjects();
  }

  // milestone in cron
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyMilestoneUpdate(): Promise<void> {
    return this.rules.evaluateMilestoneRule();
  }

  // Cron job for processing daily invoices
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processInvoicesDaily(): Promise<void> {
    await this.rules.processInvoicesDaily();
  }

  @Get('proccess-invoices-daily')
  async processInvoices(): Promise<void> {
    await this.rules.processInvoicesDaily();
  }

  // milestone in cron
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyThroughputUpdate(): Promise<void> {
    return this.rules.evaluateThroughputRule();
  }

  // behavior in cron
}
