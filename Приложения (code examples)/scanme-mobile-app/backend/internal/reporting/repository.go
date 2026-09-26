package reporting

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	platformmetrics "scanme/backend/internal/platform/metrics"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("user not found")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

type Overview struct {
	DAU                    int64              `json:"dau"`
	WAU                    int64              `json:"wau"`
	MAU                    int64              `json:"mau"`
	TotalUsers             int64              `json:"totalUsers"`
	PremiumUsers           int64              `json:"premiumUsers"`
	PremiumConversionRate  float64            `json:"premiumConversionRate"`
	ProductCacheHitRate    float64            `json:"productCacheHitRate"`
	PaywallShownLast30d    int64              `json:"paywallShownLast30d"`
	PurchaseSuccessLast30d int64              `json:"purchaseSuccessLast30d"`
	PurchaseConversionRate float64            `json:"purchaseConversionRate"`
	ScansLast14Days        []ScansPerDayPoint `json:"scansLast14Days"`
}

type ScansPerDayPoint struct {
	Day   string `json:"day"`
	Count int64  `json:"count"`
}

func (r Repository) Overview(ctx context.Context) (Overview, error) {
	var out Overview

	err := r.db.QueryRow(ctx, `
WITH params AS (
	SELECT CURRENT_DATE AS today
),
active_dau AS (
	SELECT DISTINCT user_id FROM scans s, params p
	WHERE s.scanned_at >= p.today AND s.scanned_at < p.today + INTERVAL '1 day'
	UNION
	SELECT DISTINCT user_id FROM analytics_events ae, params p
	WHERE ae.ts >= p.today AND ae.ts < p.today + INTERVAL '1 day'
),
active_wau AS (
	SELECT DISTINCT user_id FROM scans s, params p
	WHERE s.scanned_at >= p.today - INTERVAL '6 days' AND s.scanned_at < p.today + INTERVAL '1 day'
	UNION
	SELECT DISTINCT user_id FROM analytics_events ae, params p
	WHERE ae.ts >= p.today - INTERVAL '6 days' AND ae.ts < p.today + INTERVAL '1 day'
),
active_mau AS (
	SELECT DISTINCT user_id FROM scans s, params p
	WHERE s.scanned_at >= p.today - INTERVAL '29 days' AND s.scanned_at < p.today + INTERVAL '1 day'
	UNION
	SELECT DISTINCT user_id FROM analytics_events ae, params p
	WHERE ae.ts >= p.today - INTERVAL '29 days' AND ae.ts < p.today + INTERVAL '1 day'
)
SELECT
	(SELECT COUNT(*) FROM active_dau),
	(SELECT COUNT(*) FROM active_wau),
	(SELECT COUNT(*) FROM active_mau),
	(SELECT COUNT(*) FROM users),
	(SELECT COUNT(*) FROM users WHERE is_premium_until IS NOT NULL AND is_premium_until > now())
`).Scan(&out.DAU, &out.WAU, &out.MAU, &out.TotalUsers, &out.PremiumUsers)
	if err != nil {
		return Overview{}, err
	}

	if out.TotalUsers > 0 {
		out.PremiumConversionRate = float64(out.PremiumUsers) / float64(out.TotalUsers)
	}

	out.ProductCacheHitRate = platformmetrics.ProductCacheHitRatio()

	since := time.Now().UTC().AddDate(0, 0, -29).Truncate(24 * time.Hour)
	err = r.db.QueryRow(ctx, `
SELECT
	COALESCE(COUNT(*) FILTER (WHERE name = 'paywall_shown'), 0),
	COALESCE(COUNT(*) FILTER (WHERE name = 'purchase_success'), 0)
FROM analytics_events
WHERE ts >= $1
`, since).Scan(&out.PaywallShownLast30d, &out.PurchaseSuccessLast30d)
	if err != nil {
		return Overview{}, err
	}
	if out.PaywallShownLast30d > 0 {
		out.PurchaseConversionRate = float64(out.PurchaseSuccessLast30d) / float64(out.PaywallShownLast30d)
	}

	rows, err := r.db.Query(ctx, `
SELECT to_char(date_trunc('day', scanned_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::bigint
FROM scans
WHERE scanned_at >= (CURRENT_DATE AT TIME ZONE 'UTC') - INTERVAL '13 days'
GROUP BY 1
ORDER BY 1 ASC
`)
	if err != nil {
		return Overview{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var point ScansPerDayPoint
		if err := rows.Scan(&point.Day, &point.Count); err != nil {
			return Overview{}, err
		}
		out.ScansLast14Days = append(out.ScansLast14Days, point)
	}
	if err := rows.Err(); err != nil {
		return Overview{}, err
	}

	return out, nil
}

type UserRow struct {
	ID             string     `json:"id"`
	DeviceID       string     `json:"deviceId"`
	Email          *string    `json:"email"`
	IsPremiumUntil *time.Time `json:"isPremiumUntil"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type UsersListResult struct {
	Items      []UserRow `json:"items"`
	NextCursor string    `json:"nextCursor"`
}

func (r Repository) ListUsers(ctx context.Context, premiumFilter string, limit int, cursorCreatedAt *time.Time, cursorID string) (UsersListResult, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}

	var rows pgx.Rows
	var err error

	premiumClause := ""
	switch premiumFilter {
	case "premium":
		premiumClause = " AND is_premium_until IS NOT NULL AND is_premium_until > now() "
	case "free":
		premiumClause = " AND (is_premium_until IS NULL OR is_premium_until <= now()) "
	}

	if cursorCreatedAt == nil || cursorID == "" {
		rows, err = r.db.Query(ctx, `
SELECT id::text, device_id, email, is_premium_until, created_at
FROM users
WHERE 1 = 1 `+premiumClause+`
ORDER BY created_at DESC, id DESC
LIMIT $1
`, limit+1)
	} else {
		rows, err = r.db.Query(ctx, `
SELECT id::text, device_id, email, is_premium_until, created_at
FROM users
WHERE 1 = 1 `+premiumClause+`
	AND (created_at, id::text) < ($2::timestamptz, $3::text)
ORDER BY created_at DESC, id DESC
LIMIT $1
`, limit+1, *cursorCreatedAt, cursorID)
	}
	if err != nil {
		return UsersListResult{}, err
	}
	defer rows.Close()

	items := make([]UserRow, 0, limit)
	for rows.Next() {
		var item UserRow
		if err := rows.Scan(&item.ID, &item.DeviceID, &item.Email, &item.IsPremiumUntil, &item.CreatedAt); err != nil {
			return UsersListResult{}, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return UsersListResult{}, err
	}

	nextCursor := ""
	if len(items) > limit {
		last := items[limit-1]
		nextCursor = encodeUserCursor(last.CreatedAt, last.ID)
		items = items[:limit]
	}

	return UsersListResult{Items: items, NextCursor: nextCursor}, nil
}

func encodeUserCursor(ts time.Time, id string) string {
	payload := map[string]string{
		"t": ts.UTC().Format(time.RFC3339Nano),
		"i": id,
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return ""
	}
	return string(raw)
}

func DecodeUserCursor(raw string) (*time.Time, string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, "", nil
	}

	var payload struct {
		T string `json:"t"`
		I string `json:"i"`
	}
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		return nil, "", err
	}
	ts, err := time.Parse(time.RFC3339Nano, payload.T)
	if err != nil {
		return nil, "", err
	}
	if _, err := uuid.Parse(payload.I); err != nil {
		return nil, "", err
	}
	return &ts, payload.I, nil
}

func (r Repository) UpdateUserPremium(ctx context.Context, userID string, until *time.Time) (UserRow, error) {
	parsed, err := uuid.Parse(strings.TrimSpace(userID))
	if err != nil {
		return UserRow{}, err
	}

	var row UserRow
	err = r.db.QueryRow(ctx, `
UPDATE users SET
	is_premium_until = $2,
	updated_at = now()
WHERE id = $1
RETURNING id::text, device_id, email, is_premium_until, created_at
`, parsed, until).Scan(&row.ID, &row.DeviceID, &row.Email, &row.IsPremiumUntil, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return UserRow{}, ErrUserNotFound
		}
		return UserRow{}, err
	}
	return row, nil
}

type AuditRow struct {
	ID         string          `json:"id"`
	AdminEmail *string         `json:"adminEmail"`
	Action     string          `json:"action"`
	EntityType *string         `json:"entityType"`
	EntityID   *string         `json:"entityId"`
	Diff       json.RawMessage `json:"diff"`
	IP         *string         `json:"ip"`
	UserAgent  *string         `json:"userAgent"`
	CreatedAt  time.Time       `json:"createdAt"`
}

type AuditListResult struct {
	Items      []AuditRow `json:"items"`
	NextCursor string     `json:"nextCursor"`
}

func (r Repository) ListAudit(ctx context.Context, adminUserID string, entityType string, entityID string, from *time.Time, to *time.Time, limit int, cursorCreatedAt *time.Time, cursorID string) (AuditListResult, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var rows pgx.Rows
	var err error

	filters := ""
	args := []any{limit + 1}
	argPos := 2

	if aid := strings.TrimSpace(adminUserID); aid != "" {
		if _, parseErr := uuid.Parse(aid); parseErr != nil {
			return AuditListResult{}, parseErr
		}
		filters += " AND aa.admin_user_id = $" + strconv.Itoa(argPos) + "::uuid "
		args = append(args, aid)
		argPos++
	}
	if et := strings.TrimSpace(entityType); et != "" {
		filters += " AND aa.entity_type = $" + strconv.Itoa(argPos) + " "
		args = append(args, et)
		argPos++
	}
	if eid := strings.TrimSpace(entityID); eid != "" {
		filters += " AND aa.entity_id = $" + strconv.Itoa(argPos) + " "
		args = append(args, eid)
		argPos++
	}
	if from != nil {
		filters += " AND aa.created_at >= $" + strconv.Itoa(argPos) + "::timestamptz "
		args = append(args, *from)
		argPos++
	}
	if to != nil {
		filters += " AND aa.created_at <= $" + strconv.Itoa(argPos) + "::timestamptz "
		args = append(args, *to)
		argPos++
	}

	cursorFilter := ""
	if cursorCreatedAt != nil && cursorID != "" {
		cursorFilter = " AND (aa.created_at, aa.id::text) < ($" + strconv.Itoa(argPos) + "::timestamptz, $" + strconv.Itoa(argPos+1) + "::text) "
		args = append(args, *cursorCreatedAt, cursorID)
		argPos += 2
	}

	query := `
SELECT aa.id::text, au.email, aa.action, aa.entity_type, aa.entity_id, aa.diff, aa.ip, aa.user_agent, aa.created_at
FROM admin_audit aa
LEFT JOIN admin_users au ON au.id = aa.admin_user_id
WHERE 1 = 1 ` + filters + cursorFilter + `
ORDER BY aa.created_at DESC, aa.id DESC
LIMIT $1
`

	rows, err = r.db.Query(ctx, query, args...)
	if err != nil {
		return AuditListResult{}, err
	}
	defer rows.Close()

	items := make([]AuditRow, 0, limit)
	for rows.Next() {
		var item AuditRow
		var adminEmail sql.NullString
		var entityType sql.NullString
		var entityID sql.NullString
		var ip sql.NullString
		var userAgent sql.NullString
		var diff []byte

		if err := rows.Scan(&item.ID, &adminEmail, &item.Action, &entityType, &entityID, &diff, &ip, &userAgent, &item.CreatedAt); err != nil {
			return AuditListResult{}, err
		}

		item.AdminEmail = nullStringPtr(adminEmail)
		item.EntityType = nullStringPtr(entityType)
		item.EntityID = nullStringPtr(entityID)
		item.IP = nullStringPtr(ip)
		item.UserAgent = nullStringPtr(userAgent)
		if len(diff) > 0 {
			item.Diff = append(json.RawMessage(nil), diff...)
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return AuditListResult{}, err
	}

	nextCursor := ""
	if len(items) > limit {
		last := items[limit-1]
		nextCursor = encodeUserCursor(last.CreatedAt, last.ID)
		items = items[:limit]
	}

	return AuditListResult{Items: items, NextCursor: nextCursor}, nil
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	out := value.String
	return &out
}
