import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "src/entities/Order.entity";
import { OrdersService } from "./orders.service";

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
