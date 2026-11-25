import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../interfaces/user';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.get<string>('LOYALTY_JWT_SECRET');
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const authorizationHeader =
      request.headers.authorization || (request.query.token as string);
    const token = authorizationHeader?.replace(/^Bearer\s/, '');

    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.jwtSecret,
      });

      if (!payload.sId || !payload.uId || !payload.cId)
        throw new UnauthorizedException();

      const user: UserEntity = {
        session_id: payload.sId,
        user_id: payload.uId,
        client_id: payload.cId,
        retailer_code: payload.rId,
      };

      request.user = user;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException();
    }

    return true;
  }
}
