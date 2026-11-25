import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AppliesOn,
  AppliesTo,
  Direction,
  ExchangeRate,
} from '../../common/entities/exchange.entity';
import { RuleData } from './data.processor';

@Injectable()
export class ExchangeProcessor {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchanges: Repository<ExchangeRate>,
  ) {}

  // convert currency to points for earning rate
  // points = (currency * rate.points) / rate.currency
  // for a rate of 3c/10p -> 10c = 10c * 10p / 3c points
  private convert(currency: number, exchange: ExchangeRate): number {
    return (
      Math.round((exchange.point * currency * 1000) / exchange.currency) / 1000
    );
  }

  async findCurrentRate(
    data: RuleData,
    direction: Direction,
  ): Promise<ExchangeRate> {
    const exchanges = await this.exchanges.findBy({
      project: { id: data.client.projectId },
      direction,
      isActive: true,
    });

    if (!exchanges?.length) {
      console.warn({
        message: 'no active exchange rates are found',
      });
      return;
    }

    const exchangeSet = new Set(exchanges.map((ex) => ex.appliesTo));
    const hasAll = exchangeSet.size === 2 && !exchangeSet.has(AppliesTo.ALL);

    if (hasAll || exchangeSet.size > 1) {
      console.warn({
        message: 'ignoring exchange rates as exchange rates are inconsistent',
      });
      return;
    }
    let currentExchange: ExchangeRate;

    if (exchangeSet.has(AppliesTo.CUSTOMER_TIER)) {
      currentExchange = exchanges.find((ex) => ex.value === data.tier.name);
    } else if (exchangeSet.has(AppliesTo.CUSTOMER_GROUP)) {
      currentExchange = exchanges.find(
        (ex) => ex.value === data.customer.group,
      );
    } else if (exchangeSet.has(AppliesTo.CUSTOMER_SEGMENT)) {
      currentExchange = exchanges.find((ex) =>
        data.customer.segments.includes(ex.value),
      );
    } else if (exchangeSet.has(AppliesTo.ALL)) {
      currentExchange = exchanges.find((ex) => ex.appliesTo === AppliesTo.ALL);
    }

    if (!currentExchange) {
      console.warn({
        message: 'no active exchange rates are found',
      });
      return;
    }

    return currentExchange;
  }

  async calculatePoints({ cart, exchange, order }: RuleData) {
    let value: number;

    if (exchange.appliesOn === AppliesOn.SUBTOTAL) {
      value =
        cart?.prices?.subtotal_excluding_tax?.value ??
        order?.order_summary?.subtotal_excluding_tax?.value;
    } else if (exchange.appliesOn === AppliesOn.GRAND_TOTAL) {
      value =
        cart?.prices?.grand_total?.value ??
        order?.order_summary?.grand_total?.value;
    } else if (exchange.appliesOn === AppliesOn.SUBTOTAL_WITH_TAX) {
      value =
        cart?.prices?.subtotal_including_tax?.value ??
        order?.order_summary?.subtotal_including_tax?.value;
    }
    if (!value) return 0;
    return this.convert(value, exchange);
  }
}
