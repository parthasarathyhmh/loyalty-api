import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { IDParam } from '../common/dtos/id.dto';
import { PageDto } from '../common/dtos/pagination.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserEntity } from '../common/interfaces/user';
import { CatalogService } from './catalog.service';
import { CategoryResponse } from './dtos/category.dto';
import { RedeemResponse } from './dtos/redeem.dto';
import { SummaryResponse } from './dtos/summary.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('summary')
  @UseGuards(AuthGuard)
  async profile(@User() user: UserEntity): Promise<SummaryResponse> {
    return this.service.summary(user);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async byCategory(
    @User() user: UserEntity,
    @Query() query: PageDto,
    @Param() param: IDParam,
  ): Promise<CategoryResponse> {
    return this.service.byCategory(user, query, param.id);
  }

  @Post('redeem')
  @UseGuards(AuthGuard)
  async redeem(
    @User() user: UserEntity,
    @Body() body: IDParam,
  ): Promise<RedeemResponse> {
    return this.service.redeem(user, body.id);
  }
}
