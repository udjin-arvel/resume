import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('login')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async login(
    @Body() dto: { username: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { token, user } = await this.authService.login(dto.username, dto.password);
    res.cookie('jwt', token, { httpOnly: true, sameSite: 'lax' });
    return { user: { id: user.id, username: user.username, role: user.role } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { message: 'ok' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return { user: { id: req.user.userId, username: req.user.username, role: req.user.role } };
  }
}
