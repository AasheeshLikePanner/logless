package api

import (
	"encoding/json"
	"net/http"
	"log"
	"github.com/aasheesh/logless/internal/model"
	"github.com/aasheesh/logless/internal/domain"

)

type LogHandler struct {
	Processor *domain.Processor
}

func NewLogHandler(processor *domain.Processor) *LogHandler {
	return &LogHandler{Processor: processor}
}

func (h *LogHandler) HttpLogHandler(w http.ResponseWriter, r *http.Request){

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var logData model.LogEntry;
	if err := json.NewDecoder(r.Body).Decode(&logData); err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		log.Printf("Failed to decode JSON: %v", err)
		return
	}
	log.Printf("Received log: %s", logData)
	if err := h.Processor.ProcessLog(logData); err != nil {
		http.Error(w, "Failed to process log", http.StatusInternalServerError)
		log.Printf("Failed to process log: %v", err)
		return
	}

	log.Printf("[HTTP] %s: %s", logData.Level, logData.Message)
	w.WriteHeader(http.StatusOK);
	w.Write([]byte("Log stored successfully"))
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func (h *LogHandler) HttpGetAllLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	logs, err := h.Processor.GetAllLogs();
	if err != nil {
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		log.Printf("Failed to retrieve logs: %v", err)
		return
	}
	log.Printf(	"Retrieved logs: %s", logs)
	jsonLogs, err := json.Marshal(logs)
    if err != nil {
        http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
        return
    }
	log.Printf("Retrieved logs: %s", jsonLogs)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonLogs)
}