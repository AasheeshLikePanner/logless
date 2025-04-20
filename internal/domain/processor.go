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
    Save(level string, data []byte) error
	GetAllLogs() ([][]byte, error)
	GetLevelLogs(level string) ([][]byte, error)
}

type Processor struct {
    storage Storage
}

func New(storage Storage) *Processor {
    return &Processor{storage: storage}
}

func (p *Processor) ProcessLog(entry model.LogEntry)	error {

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
		TimeStamp string      `json:"TimeStamp"`
		Message   string      `json:"Message"`
		Context   map[string]string `json:"Context"`
	}{
		TimeStamp: entry.Timestamp.Format(time.RFC3339),
		Message:   entry.Message,
		Context:   entry.Context,
	})


	if err != nil {
		return err;
	}

	var buf bytes.Buffer;

	gz := gzip.NewWriter(&buf);
	_, err = gz.Write(data);
	if err != nil {
		return err;
	}
	gz.Close();

	return p.storage.Save(entry.Level,buf.Bytes());
}

func (p *Processor) GetLevelLogs(level string) ([][]byte, error) {
	return p.storage.GetLevelLogs(level)
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
			return nil, err // or: continue if you want to skip bad logs
		}

		var decompressedData bytes.Buffer
		_, err = decompressedData.ReadFrom(gz)
		gz.Close()
		if err != nil {
			return nil, err
		}

		decompressedLogs = append(decompressedLogs, decompressedData.Bytes())
	}
	log.Printf("%s", decompressedLogs)
	return decompressedLogs, nil
}
