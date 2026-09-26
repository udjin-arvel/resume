import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoundsService {
  constructor(private prisma: PrismaService) {}

  async getAllRounds() {
    return this.prisma.round.findMany({orderBy: {startAt: 'desc'}});
  }

  async createRound(user: any) {
    if (user.role !== 'admin') throw new ForbiddenException();

    const now = new Date();
    const cooldown = parseInt(process.env.ROUND_COOLDOWN_SECONDS || '30', 10) * 1000;
    const duration = parseInt(process.env.ROUND_DURATION_SECONDS || '60', 10) * 1000;
    const cooldownAt = new Date(now.getTime() + cooldown);
    const startAt = cooldownAt;
    const endAt = new Date(startAt.getTime() + duration);

    return this.prisma.round.create({
      data: {
        cooldownAt,
        startAt,
        endAt,
        createdById: user.userId,
      },
    });
  }

  async getRound(roundId: number, userId: number) {
    const round = await this.prisma.round.findUnique({where: {id: roundId}});
    if (!round) return null;

    const stats = await this.prisma.userRoundStats.findUnique({where: {userId_roundId: {userId, roundId}}});
    let winner = null;

    if (round.endAt < new Date()) {
      winner = await this.prisma.userRoundStats.findFirst({
        where: {roundId},
        orderBy: [{points: 'desc'}],
        include: {user: true},
      });
    }

    return {
      ...round,
      myStats: stats ?? {taps: 0, points: 0},
      winner: winner
        ? {userId: winner.userId, username: winner.user.username, points: winner.points}
        : null,
    };
  }
}
