package domain

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/aasheesh/logless/internal/models"
	"github.com/aasheesh/logless/internal/storage"
)

type LogService struct {
	storage storage.LogStorage
}

func NewLogService(storage storage.LogStorage) *LogService {
	return &LogService{storage: storage}
}

func (s *LogService) ProcessLogs(ctx context.Context, entries []models.LogEntry) error {
    var (
        levels      []string
        compresseds [][]byte
        jsons       []string
    )

    for _, entry := range entries {
        if entry.Level == "" {
            entry.Level = "info"
        }
        if entry.Timestamp.IsZero() {
            entry.Timestamp = time.Now()
        }

        data, err := json.Marshal(entry)
        if err != nil {
            log.Printf("Marshal error: %v", err)
            continue
        }

        var compressed bytes.Buffer
        gz := gzip.NewWriter(&compressed)
        if _, err := gz.Write(data); err != nil {
            log.Printf("Compression error: %v", err)
            continue
        }
        gz.Close()

        levels = append(levels, entry.Level)
        compresseds = append(compresseds, compressed.Bytes())
        jsons = append(jsons, string(data))
    }

    return s.storage.SaveLog(ctx, levels, compresseds, jsons)
}

func (s *LogService) GetPaginatedLogs(ctx context.Context, page, pageSize int) (*models.PaginatedLogsResponse, error) {
	if page < 1 || pageSize < 1 {
		return nil, errors.New("invalid pagination parameters")
	}

	offset := (page - 1) * pageSize
	compressedLogs, err := s.storage.GetPaginatedLogs(ctx, pageSize, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get paginated logs: %w", err)
	}

	logs, err := s.decompressLogs(compressedLogs)
	if err != nil {
		return nil, fmt.Errorf("failed to decompress logs: %w", err)
	}

	totalCount, err := s.storage.GetLogsCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get logs count: %w", err)
	}

	return &models.PaginatedLogsResponse{
		Data:       logs,
		Page:       page,
		PageSize:   pageSize,
		TotalCount: totalCount,
		TotalPages: int(math.Ceil(float64(totalCount) / float64(pageSize))),
	}, nil
}

func (s *LogService) GetLevelLogs(ctx context.Context, level string) ([][]byte, error) {
	if level == "" {
		return nil, errors.New("level cannot be empty")
	}

	compressedLogs, err := s.storage.GetLevelLogs(ctx, level)
	if err != nil {
		return nil, fmt.Errorf("failed to get level logs: %w", err)
	}

	return s.decompressLogs(compressedLogs)
}

func (s *LogService) GetSearchLogs(ctx context.Context, searchTerm string) ([][]byte, error) {
	if searchTerm == "" {
		return nil, errors.New("search term cannot be empty")
	}

	compressedLogs, err := s.storage.GetSearchLogs(ctx, searchTerm)
	if err != nil {
		return nil, fmt.Errorf("failed to search logs: %w", err)
	}

	return s.decompressLogs(compressedLogs)
}

func (s *LogService) SetLevelColors(ctx context.Context, level, color string) error {
	if level == "" || color == "" {
		return errors.New("level and color cannot be empty")
	}

	return s.storage.SetLevelColors(ctx, level, color)
}

func (s *LogService) GetLevelColors(ctx context.Context) (map[string]string, error) {
	return s.storage.GetLevelColors(ctx)
}

func (s *LogService) decompressLogs(compressedLogs [][]byte) ([][]byte, error) {
	var logs [][]byte
	for _, compressed := range compressedLogs {
		gz, err := gzip.NewReader(bytes.NewBuffer(compressed))
		if err != nil {
			return nil, fmt.Errorf("failed to create gzip reader: %w", err)
		}

		var decompressed bytes.Buffer
		if _, err := decompressed.ReadFrom(gz); err != nil {
			return nil, fmt.Errorf("failed to decompress data: %w", err)
		}
		gz.Close()

		logs = append(logs, decompressed.Bytes())
	}
	return logs, nil
}

func (s *LogService) HealthCheck(ctx context.Context) (*models.HealthResponse, error) {
	// Check database connection
	if _, err := s.storage.GetLogsCount(ctx); err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	return &models.HealthResponse{
		Status:  "healthy",
		Version: "1.0.0",
	}, nil
}
