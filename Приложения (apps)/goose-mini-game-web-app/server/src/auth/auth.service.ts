import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async login(username: string, password: string) {
    let user = await this.usersService.findByUsername(username);

    if (!user) {
      let role = 'survivor';
      if (username === 'admin') role = 'admin';
      if (username === 'Никита' || username === 'Nikita') role = 'nikita';
      const passwordHash = await bcrypt.hash(password, 10);

      user = await this.usersService.createUser(username, passwordHash, role);
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.jwtService.sign({ id: user.id, username: user.username, role: user.role });

    return {token, user};
  }
}
