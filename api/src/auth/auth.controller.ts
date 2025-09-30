import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @Post('register')
  register(@Body() dto: { email: string; password: string }) {
    return this.svc.register(dto.email, dto.password);
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return this.svc.login(dto.email, dto.password);
  }
}
