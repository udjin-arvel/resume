package sentryplatform

import (
	"time"

	"github.com/getsentry/sentry-go"
)

func Init(dsn, env string) error {
	if dsn == "" {
		return nil
	}

	return sentry.Init(sentry.ClientOptions{
		Dsn:         dsn,
		Environment: env,
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			if event.Request != nil {
				event.Request.Headers = map[string]string{}
			}
			if event.User.Email != "" {
				event.User.Email = ""
			}
			return event
		},
	})
}

func Flush() {
	sentry.Flush(2 * time.Second)
}
