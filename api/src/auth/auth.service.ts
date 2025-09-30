import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Membership) private memberships: Repository<Membership>,
    private jwt: JwtService
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.save(this.users.create({ email, passwordHash }));
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);
    return { accessToken: token };
  }

  async verify(token: string) {
    return this.jwt.verifyAsync(token);
  }
}
