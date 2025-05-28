package storage

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LogStorage interface {
	SaveLog(ctx context.Context, level string, data []byte, jsonData []byte) error
	GetLevelLogs(ctx context.Context, level string) ([][]byte, error)
	GetPaginatedLogs(ctx context.Context, limit, offset int) ([][]byte, error)
	GetSearchLogs(ctx context.Context, searchTerm string) ([][]byte, error)
	SetLevelColors(ctx context.Context, level, color string) error
	GetLevelColors(ctx context.Context) (map[string]string, error)
	GetLogsCount(ctx context.Context) (int, error)
}

type PostgresStorage struct {
	db *pgxpool.Pool
}

func NewPostgresStorage(connStr string) (*PostgresStorage, error) {
	db, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := db.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &PostgresStorage{db: db}, nil
}

func (s *PostgresStorage) SaveLog(ctx context.Context, level string, data []byte, jsonData []byte) error {
	_, err := s.db.Exec(ctx,
		`INSERT INTO logs (level, compressed_data, log_text) VALUES ($1, $2, to_tsvector($3))`,
		level, data, string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to save log: %w", err)
	}
	return nil
}

func (s *PostgresStorage) GetLevelLogs(ctx context.Context, level string) ([][]byte, error) {
	rows, err := s.db.Query(ctx,
		"SELECT compressed_data FROM logs WHERE level = $1 ORDER BY timestamp DESC", level)
	if err != nil {
		return nil, fmt.Errorf("failed to get level logs: %w", err)
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var data []byte
		if err := rows.Scan(&data); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		logs = append(logs, data)
	}
	return logs, rows.Err()
}

func (s *PostgresStorage) GetPaginatedLogs(ctx context.Context, limit, offset int) ([][]byte, error) {
	rows, err := s.db.Query(ctx,
		"SELECT compressed_data FROM logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
		limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get paginated logs: %w", err)
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var data []byte
		if err := rows.Scan(&data); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		logs = append(logs, data)
	}
	return logs, rows.Err()
}

func (s *PostgresStorage) GetSearchLogs(ctx context.Context, searchTerm string) ([][]byte, error) {
	rows, err := s.db.Query(ctx,
		"SELECT compressed_data FROM logs WHERE log_text @@ to_tsquery($1) ORDER BY timestamp DESC",
		searchTerm)
	if err != nil {
		return nil, fmt.Errorf("failed to search logs: %w", err)
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var data []byte
		if err := rows.Scan(&data); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		logs = append(logs, data)
	}
	return logs, rows.Err()
}

func (s *PostgresStorage) SetLevelColors(ctx context.Context, level, color string) error {
	_, err := s.db.Exec(ctx,
		`INSERT INTO colors (level, color)
		 VALUES ($1, $2)
		 ON CONFLICT (level)
		 DO UPDATE SET color = EXCLUDED.color`,
		level, color)
	if err != nil {
		return fmt.Errorf("failed to set level color: %w", err)
	}
	return nil
}

func (s *PostgresStorage) GetLevelColors(ctx context.Context) (map[string]string, error) {
	rows, err := s.db.Query(ctx, "SELECT level, color FROM colors ORDER BY level")
	if err != nil {
		return nil, fmt.Errorf("failed to get level colors: %w", err)
	}
	defer rows.Close()

	colors := make(map[string]string)
	for rows.Next() {
		var level, color string
		if err := rows.Scan(&level, &color); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		colors[level] = color
	}
	return colors, rows.Err()
}

func (s *PostgresStorage) GetLogsCount(ctx context.Context) (int, error) {
	var count int
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM logs").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get logs count: %w", err)
	}
	return count, nil
}