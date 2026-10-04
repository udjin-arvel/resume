// src/metrics/metrics.service.ts
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import * as fs from "fs";
import { join } from "path";

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly fileLogPath: string;
  private logStream: fs.WriteStream;

  constructor() {
    this.fileLogPath = join(process.cwd(), "metrics.log"); // File path for metrics
    this.logStream = fs.createWriteStream(this.fileLogPath, { flags: "a" });
    this.logStream.on("error", (err) => {
      this.logger.error("Error writing to metrics log file:", err);
    });
  }

  async logMetric(name: string, data: any) {
    this.logMetricToFile(name, data);
  }

  private logMetricToFile(name: string, data: any): void {
    const logEntry =
      JSON.stringify({ timestamp: new Date(), name, data }) + "\n";
    this.logStream.write(logEntry);
  }

  onModuleDestroy() {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}
