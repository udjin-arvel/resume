import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { MetricsService } from "src/metrics/metrics.service";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  // In-memory storage for metrics (replace with a database or monitoring service in production)
  private metrics = {
    requestCounts: {
      total: 0,
      perMinute: new Map<number, number>(), // Minute timestamp -> count
      perHour: new Map<number, number>(), // Hour timestamp -> count
      perDay: new Map<number, number>(), // Day timestamp -> count
    },
    errorCounts: 0,
    responseTimes: [] as number[], // Array to store response times for calculating percentiles
  };

  constructor(private metricsService: MetricsService) {
    // Periodically log and reset metrics (e.g., every minute)
    setInterval(() => this.logAndResetMetrics(), 60 * 1000);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, url, headers, body } = req;

    const startTime = Date.now();
    let errorOccurred = false;

    // Increment request counts
    this.metrics.requestCounts.total++;
    this.incrementTimeBasedCounts(this.metrics.requestCounts.perMinute);
    this.incrementTimeBasedCounts(this.metrics.requestCounts.perHour, 60);
    this.incrementTimeBasedCounts(this.metrics.requestCounts.perDay, 60 * 24);

    res.on("finish", async () => {
      const { statusCode } = res;
      const elapsedTime = Date.now() - startTime;

      // Log the request using Winston (your existing logger)
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${elapsedTime}ms`,
        "RequestLogger",
      );

      // this.logger.log(
      //   `Incoming Request: ${method} ${url} - Headers: ${JSON.stringify(headers)} - Body: ${JSON.stringify(body)?.slice(0, 100)}...`,
      //   "REQUEST DUPMER",
      // );

      // Store response time
      this.metrics.responseTimes.push(elapsedTime);

      // Increment error count if status code is 4xx or 5xx
      if (statusCode >= 400) {
        this.metrics.errorCounts++;
        errorOccurred = true;
        this.logger.error(
          {
            method,
            url: originalUrl,
            statusCode,
            elapsedTime,
            // error: err.message, // Assuming you have an error object
          },
          "Request failed",
        );
      }

      const metricsData = {
        method,
        url: originalUrl,
        statusCode,
        elapsedTime,
      };

      // Log metrics using MetricsService
      await this.metricsService.logMetric("request", metricsData); // `false` for file logging
      if (statusCode >= 400) {
        // Log error metrics using MetricsService
        await this.metricsService.logMetric("error", metricsData); // `false` for file logging
      }
    });

    res.on("close", () => {
      if (!res.writableFinished && !errorOccurred) {
        const elapsedTime = Date.now() - startTime;
        this.logger.warn(
          {
            method,
            url: originalUrl,
            elapsedTime,
          },
          "Connection closed prematurely by the client",
        );

        // Log aborted request metrics using MetricsService
        const metricsData = {
          method,
          url: originalUrl,
          elapsedTime,
          status: "aborted",
        };
        this.metricsService.logMetric("request_aborted", metricsData); // `false` for file logging
      }
    });

    next();
  }

  private incrementTimeBasedCounts(
    counts: Map<number, number>,
    timeUnitInMinutes = 1,
  ) {
    const now = new Date();
    const timeUnit = Math.floor(
      now.getTime() / (60 * 1000 * timeUnitInMinutes),
    ); // Get the current minute, hour, or day
    counts.set(timeUnit, (counts.get(timeUnit) || 0) + 1);
  }

  private logAndResetMetrics() {
    // Calculate average and 95th percentile response times
    const avgResponseTime =
      this.metrics.responseTimes.length > 0
        ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
          this.metrics.responseTimes.length
        : 0;
    const p95ResponseTime = this.calculatePercentile(
      this.metrics.responseTimes,
      95,
    );

    // Log the metrics using Winston
    this.logger.log(
      `Requests: total=${this.metrics.requestCounts.total}, perMinute=${this.getCountsForCurrentTimeUnit(this.metrics.requestCounts.perMinute)}, perHour=${this.getCountsForCurrentTimeUnit(this.metrics.requestCounts.perHour)}, perDay=${this.getCountsForCurrentTimeUnit(this.metrics.requestCounts.perDay)}, errors=${this.metrics.errorCounts}, avgResponseTime=${avgResponseTime.toFixed(2)}ms, p95ResponseTime=${p95ResponseTime.toFixed(2)}ms`,
      "Metrics",
    );

    // Reset the metrics (except for the total request count)
    this.metrics.requestCounts.perMinute.clear();
    this.metrics.requestCounts.perHour.clear();
    this.metrics.requestCounts.perDay.clear();
    this.metrics.errorCounts = 0;
    this.metrics.responseTimes = [];
  }

  private getCountsForCurrentTimeUnit(counts: Map<number, number>): number {
    const now = new Date();
    const currentMinute = Math.floor(now.getTime() / (60 * 1000));
    return counts.get(currentMinute) || 0;
  }

  private calculatePercentile(values: number[], percentile: number) {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }
}
