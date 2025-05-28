package models

import "time"

type LogEntry struct {
	Level     string            `json:"level"`
	Message   string            `json:"message"`
	Timestamp time.Time         `json:"timestamp"`
	Context   map[string]string `json:"context,omitempty"`
}

type ColorEntry struct {
	Level string `json:"level"`
	Color string `json:"color"`
}

type PaginatedLogsResponse struct {
	Data       [][]byte `json:"data"`
	Page       int      `json:"page"`
	PageSize   int      `json:"pageSize"`
	TotalCount int      `json:"totalCount"`
	TotalPages int      `json:"totalPages"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}