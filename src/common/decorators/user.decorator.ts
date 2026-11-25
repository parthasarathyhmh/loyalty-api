import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserEntity } from '../interfaces/user';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
