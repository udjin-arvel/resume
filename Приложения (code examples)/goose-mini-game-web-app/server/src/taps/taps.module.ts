import { Module } from '@nestjs/common';
import { TapsService } from './taps.service';
import { TapsController } from './taps.controller';

@Module({
  providers: [TapsService],
  controllers: [TapsController],
})

export class TapsModule {}
