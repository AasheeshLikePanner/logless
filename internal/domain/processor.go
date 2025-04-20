package domain

import (
	"encoding/json"
	"errors"
	"time"
	"bytes"
    "compress/gzip"
	"github.com/aasheesh/logless/internal/model"
)

type Storage interface {
    Save(leve string, data []byte) error
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
		Context   interface{} `json:"Context"`
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