import { IsJWT, IsString } from 'class-validator';

export class AuthDto {
  @IsJWT()
  token: string;

  @IsString()
  clientId: string;
}

export class AuthResponse {
  token: string;
  isLoyal: boolean;
  isFeedback: boolean;
}
