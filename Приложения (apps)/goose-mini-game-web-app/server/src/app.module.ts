import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RoundsModule } from './rounds/rounds.module';
import { UsersModule } from './users/users.module';
import { TapsModule } from './taps/taps.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    RoundsModule,
    TapsModule,
  ],
})

export class AppModule {}
