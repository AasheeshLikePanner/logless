package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aasheesh/logless/internal/domain"
	"github.com/aasheesh/logless/internal/model"
	"github.com/gorilla/mux"
)

type LogHandler struct {
	Processor *domain.Processor
}

func NewLogHandler(processor *domain.Processor) *LogHandler {
	return &LogHandler{Processor: processor}
}

func (h *LogHandler) HttpLogHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var logData model.LogEntry
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
	w.WriteHeader(http.StatusOK)
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
 
	logs, err := h.Processor.GetAllLogs()
	if err != nil {
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		log.Printf("Failed to retrieve logs: %v", err)
		return
	}

	// Convert the array of JSON bytes into a single JSON array
	var logEntries []json.RawMessage
	for _, logBytes := range logs {
		logEntries = append(logEntries, logBytes)
	}
	
	jsonResponse, err := json.Marshal(logEntries)
	if err != nil {
		http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonResponse)
}

func (h *LogHandler) HttpGetLevelLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	level := vars["level"]

	if level == "" {
		http.Error(w, "Missing level parameter", http.StatusBadRequest)
		return
	}
	logs, err := h.Processor.GetLevelLogs(level)
	if err != nil {
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		log.Printf("Failed to retrieve logs: %v", err)
		return
	}
	jsonLogs, err := json.Marshal(logs)
	if err != nil {
		http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonLogs)
}

func (h *LogHandler) HttpGetSearchLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Get variables from the URL path using mux
	vars := mux.Vars(r)
	searchTerm := vars["rest"] // Get the rest of the path as search term

	if searchTerm == "" {
		http.Error(w, "Missing search term in URL", http.StatusBadRequest)
		return
	}

	logs, err := h.Processor.GetSearchLogs(searchTerm)
	if err != nil {
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		log.Printf("Failed to retrieve logs: %v", err)
		return
	}
	jsonLogs, err := json.Marshal(logs)
	if err != nil {
		http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonLogs)
}

func (h *LogHandler) HttpSetLevelColors(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var levelColors model.ColorEntry
	if err := json.NewDecoder(r.Body).Decode(&levelColors); err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		log.Printf("Failed to decode JSON: %v", err)
		return
	}
	vars := mux.Vars(r)
	level := vars["level"] 
	log.Println(level);
	if err := h.Processor.SetLevelColors(level, levelColors.Color); err != nil {
		http.Error(w, "Failed to set level colors", http.StatusInternalServerError)
		log.Printf("Failed to set level colors: %v", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Level colors set successfully"))
}

func (h *LogHandler) HttpGetLevelColors(w http.ResponseWriter, r *http.Request) {
	log.Println('1')
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	colors, err := h.Processor.GetLevelColors()
	if err != nil {
		http.Error(w, "Failed to retrieve level colors", http.StatusInternalServerError)
		log.Printf("Failed to retrieve level colors: %v", err)
		return
	}

	jsonColors, err := json.Marshal(colors)
	if err != nil {
		http.Error(w, "Failed to encode level colors", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonColors)
}