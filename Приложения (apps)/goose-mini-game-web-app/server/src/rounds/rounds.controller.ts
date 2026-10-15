import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rounds')
@UseGuards(JwtAuthGuard)
export class RoundsController {
  constructor(private roundsService: RoundsService) {}

  @Get()
  async getAllRounds() {
    return this.roundsService.getAllRounds();
  }

  @Post()
  async createRound(@Request() req: any) {
    return this.roundsService.createRound(req.user);
  }

  @Get(':id')
  async getRound(@Request() req: any, @Param('id') id: string) {
    return this.roundsService.getRound(+id, req.user.userId);
  }
}
