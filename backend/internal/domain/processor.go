package domain

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/aasheesh/logless/internal/model"
)

type Storage interface {
	Save(level string, data []byte, jsonData []byte) error
	GetAllLogs() ([][]byte, error)
	GetLevelLogs(level string) ([][]byte, error)
	GetSearchLogs(searchTerm string) ([][]byte, error)
}

type Processor struct {
	storage Storage
}

func New(storage Storage) *Processor {
	return &Processor{storage: storage}
}

func (p *Processor) ProcessLog(entry model.LogEntry) error {

	if entry.Level == "" {
		entry.Level = "info"
	}

	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}

	if entry.Message == "" {
		return errors.New("log message cannot be empty")
	}

	data, err := json.Marshal(struct {
		TimeStamp string            `json:"TimeStamp"`
		Level     string            `json:"Level"`
		Message   string            `json:"Message"`
		Context   map[string]string `json:"Context"`
	}{
		TimeStamp: entry.Timestamp.Format(time.RFC3339),
		Level:     entry.Level,
		Message:   entry.Message,
		Context:   entry.Context,
	})

	if err != nil {
		return err
	}

	var buf bytes.Buffer

	gz := gzip.NewWriter(&buf)
	_, err = gz.Write(data)
	if err != nil {
		return err
	}
	gz.Close()

	return p.storage.Save(entry.Level, buf.Bytes(), data)
}

func (p *Processor) GetLevelLogs(level string) ([][]byte, error) {
	compressedLogs, err := p.storage.GetLevelLogs(level)
	if err != nil {
		return nil, err
	}

	var decompressedLogs [][]byte
	for _, compressed := range compressedLogs {
		gz, err := gzip.NewReader(bytes.NewBuffer(compressed))
		if err != nil {
			return nil, err
		}

		var decompressedData bytes.Buffer
		_, err = decompressedData.ReadFrom(gz)
		gz.Close()
		if err != nil {
			return nil, err
		}

		// Validate that we have valid JSON data
		var logEntry struct {
			TimeStamp string            `json:"TimeStamp"`
			Level     string            `json:"Level"`
			Message   string            `json:"Message"`
			Context   map[string]string `json:"Context"`
		}	

		if err := json.Unmarshal(decompressedData.Bytes(), &logEntry); err != nil {
			return nil, err
		}
		// Check if the log entry matches the requested level
		if logEntry.Level != level {
			continue
		}
		// Re-marshal the data to ensure it's properly formatted
		formattedJSON, err := json.Marshal(logEntry)
		if err != nil {
			return nil, err
		}

		decompressedLogs = append(decompressedLogs, formattedJSON)
	}

	return decompressedLogs, nil
}

func (p *Processor) GetAllLogs() ([][]byte, error) {
	compressedLogs, err := p.storage.GetAllLogs()
	if err != nil {
		return nil, err
	}

	var decompressedLogs [][]byte

	for _, compressed := range compressedLogs {
		gz, err := gzip.NewReader(bytes.NewBuffer(compressed))
		if err != nil {
			return nil, err
		}

		var decompressedData bytes.Buffer
		_, err = decompressedData.ReadFrom(gz)
		gz.Close()
		if err != nil {
			return nil, err
		}

		// Validate that we have valid JSON data
		var logEntry struct {
			TimeStamp string            `json:"TimeStamp"`
			Level     string            `json:"Level"`
			Message   string            `json:"Message"`
			Context   map[string]string `json:"Context"`
		}

		if err := json.Unmarshal(decompressedData.Bytes(), &logEntry); err != nil {
			return nil, err
		}
		// Check if the log entry matches the requested level
		log.Println(logEntry.Level)
		// Re-marshal the data to ensure it's properly formatted
		formattedJSON, err := json.Marshal(logEntry)
		if err != nil {
			return nil, err
		}

		decompressedLogs = append(decompressedLogs, formattedJSON)
	}

	return decompressedLogs, nil
}

func (p *Processor) GetSearchLogs(searchTerm string) ([][]byte, error) {
	compressedLogs, err := p.storage.GetSearchLogs(searchTerm)
	if err != nil {
		return nil, err
	}

	var decompressedLogs [][]byte
	for _, compressed := range compressedLogs {
		gz, err := gzip.NewReader(bytes.NewBuffer(compressed))
		if err != nil {
			return nil, err
		}

		var decompressedData bytes.Buffer
		_, err = decompressedData.ReadFrom(gz)
		gz.Close()
		if err != nil {
			return nil, err
		}

		// Validate that we have valid JSON data
		var logEntry struct {
			TimeStamp string            `json:"TimeStamp"`
			Level     string            `json:"Level"`
			Message   string            `json:"Message"`
			Context   map[string]string `json:"Context"`
		}

		if err := json.Unmarshal(decompressedData.Bytes(), &logEntry); err != nil {
			return nil, err
		}

		// Re-marshal the data to ensure it's properly formatted
		formattedJSON, err := json.Marshal(logEntry)
		if err != nil {
			return nil, err
		}

		decompressedLogs = append(decompressedLogs, formattedJSON)
	}

	return decompressedLogs, nil
}
