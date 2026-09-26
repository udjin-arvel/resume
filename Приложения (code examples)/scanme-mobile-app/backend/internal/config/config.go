package config

import (
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Env             string        `envconfig:"APP_ENV" default:"development"`
	HTTPAddr        string        `envconfig:"HTTP_ADDR" default:":8080"`
	ShutdownTimeout time.Duration `envconfig:"SHUTDOWN_TIMEOUT" default:"10s"`

	DatabaseURL string `envconfig:"DATABASE_URL" default:"postgres://scanme:scanme@localhost:5432/scanme?sslmode=disable"`
	RedisURL    string `envconfig:"REDIS_URL" default:"redis://localhost:6379/0"`
	LogLevel    string `envconfig:"LOG_LEVEL" default:"info"`

	JWTSecret              string        `envconfig:"JWT_SECRET" default:"dev-only-change-me"`
	AccessTokenTTL         time.Duration `envconfig:"ACCESS_TOKEN_TTL" default:"15m"`
	RefreshTokenTTL        time.Duration `envconfig:"REFRESH_TOKEN_TTL" default:"720h"`
	AdminAccessTokenTTL    time.Duration `envconfig:"ADMIN_ACCESS_TOKEN_TTL" default:"30m"`
	AdminPasswordPepper    string        `envconfig:"ADMIN_PASSWORD_PEPPER"`
	InitialAdminEmail      string        `envconfig:"INITIAL_ADMIN_EMAIL"`
	InitialAdminPassword   string        `envconfig:"INITIAL_ADMIN_PASSWORD"`
	AllowInsecureDevTokens bool          `envconfig:"ALLOW_INSECURE_DEV_TOKENS" default:"true"`

	OpenFoodFactsBaseURL string        `envconfig:"OPEN_FOOD_FACTS_BASE_URL" default:"https://world.openfoodfacts.org"`
	OpenFoodFactsTimeout time.Duration `envconfig:"OPEN_FOOD_FACTS_TIMEOUT" default:"8s"`
	ProductCacheTTL      time.Duration `envconfig:"PRODUCT_CACHE_TTL" default:"720h"`
	ProductOffMissTTL    time.Duration `envconfig:"PRODUCT_OFF_MISS_TTL" default:"168h"`

	DeepSeekAPIKey     string        `envconfig:"DEEPSEEK_API_KEY"`
	DeepSeekBaseURL    string        `envconfig:"DEEPSEEK_BASE_URL" default:"https://api.deepseek.com/v1"`
	DeepSeekModel      string        `envconfig:"DEEPSEEK_MODEL" default:"deepseek-chat"`
	DeepSeekTimeout    time.Duration `envconfig:"DEEPSEEK_TIMEOUT" default:"90s"`
	DeepSeekMaxRetries int           `envconfig:"DEEPSEEK_MAX_RETRIES" default:"1"`

	SentryDSN string `envconfig:"SENTRY_DSN"`
}

func Load() (Config, error) {
	_ = godotenv.Load()

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}
