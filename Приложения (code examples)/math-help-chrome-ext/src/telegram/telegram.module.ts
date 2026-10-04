import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TelegramService } from "./telegram.service";
import { TelegramMonitoringService } from "./telegram-monitoring.service";
import { TelegramController } from "./telegram.controller";
import { User } from "../entities/User.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
  ],
  providers: [TelegramService, TelegramMonitoringService],
  controllers: [TelegramController],
  exports: [TelegramService, TelegramMonitoringService],
})

export class TelegramModule {}