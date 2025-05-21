package model


// LogEntry represents a single log message
type ColorEntry struct {
    Level     string            `json:"level"`       // info, warn, error
    Color   string            `json:"color"`     // Color text
}
