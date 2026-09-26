package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	dto "github.com/prometheus/client_model/go"
)

const (
	metricProductCacheHits   = "scanme_product_cache_hits_total"
	metricProductCacheMisses = "scanme_product_cache_misses_total"
)

var (
	HTTPRequestDurationSeconds = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_server_request_duration_seconds",
			Help:    "Latency of HTTP requests handled by this process.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "route", "status"},
	)

	ProductCacheHits = promauto.NewCounter(prometheus.CounterOpts{
		Name: metricProductCacheHits,
		Help: "Product lookups served from Postgres cache.",
	})

	ProductCacheMisses = promauto.NewCounter(prometheus.CounterOpts{
		Name: metricProductCacheMisses,
		Help: "Product lookups that required fetching from Open Food Facts.",
	})

	ScansRecorded = promauto.NewCounter(prometheus.CounterOpts{
		Name: "scanme_scans_recorded_total",
		Help: "Scans successfully persisted via POST /v1/scans.",
	})

	DeepSeekRequestDurationSeconds = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "scanme_deepseek_request_duration_seconds",
		Help:    "Latency of outbound DeepSeek chat-completion requests when enrichment is enabled.",
		Buckets: []float64{0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120},
	})
)

// ProductCacheHitRatio returns hits / (hits+misses) from the default gatherer (same process).
func ProductCacheHitRatio() float64 {
	mfs, err := prometheus.DefaultGatherer.Gather()
	if err != nil {
		return 0
	}

	var hits, misses float64
	for _, mf := range mfs {
		switch mf.GetName() {
		case metricProductCacheHits:
			hits = counterFamilySum(mf)
		case metricProductCacheMisses:
			misses = counterFamilySum(mf)
		}
	}

	denom := hits + misses
	if denom == 0 {
		return 0
	}
	return hits / denom
}

func counterFamilySum(mf *dto.MetricFamily) float64 {
	var sum float64
	for _, m := range mf.GetMetric() {
		if c := m.GetCounter(); c != nil {
			sum += c.GetValue()
		}
	}
	return sum
}
