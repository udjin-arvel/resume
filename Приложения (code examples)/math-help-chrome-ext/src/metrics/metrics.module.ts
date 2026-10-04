// src/metrics/metrics.modules.ts
import { Module } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Module({
  providers: [MetricsService],
  exports: [MetricsService], // Export MetricsService to make it available for injection in other modules
})
export class MetricsModule {}
