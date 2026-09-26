import { Controller, Post, Param, Request, UseGuards } from '@nestjs/common';
import { TapsService } from './taps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rounds/:roundId/tap')
@UseGuards(JwtAuthGuard)
export class TapsController {
  constructor(private tapsService: TapsService) {}

  @Post()
  async tap(@Request() req: any, @Param('roundId') roundId: string) {
    return this.tapsService.tapGoose(req.user, +roundId);
  }
}
