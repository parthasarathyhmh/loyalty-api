import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ConsumerType } from '../decorators/consumer.decorator';

@Injectable()
export class MachineGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const consumer = this.reflector.get<ConsumerType>(
      'consumer',
      context.getHandler(),
    );
    const consumerToken = this.config.get(`${consumer}_M2M_TOKEN`);
    if (!consumerToken) {
      console.error({
        message: `missing ${consumer}_M2M_TOKEN`,
      });
      throw new InternalServerErrorException('misconfigured config');
    }

    const m2mToken = `Bearer ${consumerToken}`;

    const request = context.switchToHttp().getRequest();
    if (
      request.headers.authorization &&
      request.headers.authorization === m2mToken
    ) {
      return true;
    }
    throw new UnauthorizedException();
  }
}
