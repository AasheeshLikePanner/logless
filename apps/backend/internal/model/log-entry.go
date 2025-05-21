package model

import "time"

// LogEntry represents a single log message
type LogEntry struct {
    Timestamp time.Time         `json:"timestamp"`   // When the log happened
    Level     string            `json:"level"`       // info, warn, error
    Message   string            `json:"message"`     // Log text
    Context   map[string]string `json:"context"`     // Extra metadata (userID, IP, etc.)
}
