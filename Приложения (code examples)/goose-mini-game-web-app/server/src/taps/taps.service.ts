import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TapsService {
  constructor(private prisma: PrismaService) {}

  async tapGoose(user: any, roundId: number) {
    return this.prisma.$transaction(async (tx) => {
      const userDb = await tx.user.findUnique({where: {id: user.userId}});
      const round = await tx.round.findUnique({where: {id: roundId}});
      if (!userDb || !round) throw new BadRequestException('not found');

      const now = new Date();
      if (now < round.startAt || now > round.endAt) throw new ForbiddenException('Round not active');

      const isNikita = userDb.role === 'nikita';

      let stats = await tx.userRoundStats.findUnique({
        where: {userId_roundId: {userId: user.userId, roundId}},
      });
      if (!stats) {
        stats = await tx.userRoundStats.create({
          data: {userId: user.userId, roundId, taps: 0, points: 0},
        });
      }

      const newTapNumber = stats.taps + 1;
      let addPoints = 1;
      if (newTapNumber % 11 === 0) addPoints = 10;

      await tx.tap.create({
        data: {userId: user.userId, roundId, tapNumber: newTapNumber},
      });
      await tx.userRoundStats.update({
        where: {id: stats.id},
        data: {
          taps: {increment: 1},
          points: {increment: isNikita ? 0 : addPoints},
        },
      });

      return {
        taps: isNikita ? 0 : stats.taps + 1,
        points: isNikita ? 0 : stats.points + addPoints,
      };
    });
  }
}
