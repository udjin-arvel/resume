package config

import (
	"os"
	"strconv"
)

type Config struct {
	AppEnv                      string
	AppURL                      string
	APIPort                     int
	DatabaseURL                 string
	JWTSecret                   string
	JWTRefreshSecret            string
	TelegramBotToken            string
	UploadDir                   string
	CORSOrigins                 string
	RegistrationEnabled         bool
	ManagerInviteSecret         string
	WorkerInviteSecret          string
	ReportOverdueCheckInterval  string
	CronEnabled                 bool
	CronReportOverdue           string
	CronToolCalibration         string
	CronToolReturn              string
	CronWorkerWeeklyReminder    string
	CronSupervisorDailyReminder string
}

func Load() Config {
	port, _ := strconv.Atoi(getEnv("API_PORT", "8080"))

	return Config{
		AppEnv:                      getEnv("APP_ENV", "dev"),
		AppURL:                      getEnv("APP_URL", "http://localhost:3000"),
		APIPort:                     port,
		DatabaseURL:                 getEnv("DATABASE_URL", ""),
		JWTSecret:                   getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTRefreshSecret:            getEnv("JWT_REFRESH_SECRET", ""),
		TelegramBotToken:            getEnv("TELEGRAM_BOT_TOKEN", ""),
		UploadDir:                   getEnv("UPLOAD_DIR", "./uploads"),
		CORSOrigins:                 getEnv("CORS_ORIGINS", "http://localhost:3000"),
		RegistrationEnabled:         getEnv("REGISTRATION_ENABLED", "true") == "true",
		ManagerInviteSecret:         getEnv("MANAGER_INVITE_SECRET", ""),
		WorkerInviteSecret:          getEnv("WORKER_INVITE_SECRET", ""),
		ReportOverdueCheckInterval:  getEnv("REPORT_OVERDUE_CHECK_INTERVAL", "1h"),
		CronEnabled:                 getEnv("CRON_ENABLED", "true") == "true",
		CronReportOverdue:           getEnv("CRON_REPORT_OVERDUE", "0 9 * * *"),
		CronToolCalibration:         getEnv("CRON_TOOL_CALIBRATION", "0 8 * * *"),
		CronToolReturn:              getEnv("CRON_TOOL_RETURN", "30 8 * * *"),
		CronWorkerWeeklyReminder:    getEnv("CRON_WORKER_WEEKLY_REMINDER", getEnv("CRON_REPORT_REMINDER", "0 10 * * 1")),
		CronSupervisorDailyReminder: getEnv("CRON_SUPERVISOR_DAILY_REMINDER", "0 18 * * 1-5"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
