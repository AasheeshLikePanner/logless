package api

import (
	"encoding/json"
	"net/http"
	"log"
)

type LogEntry struct {
    Level   string `json:"level"`
    Message string `json:"message"`
}

func HttpLogHandler(w http.ResponseWriter, r *http.Request){

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var logData LogEntry;
	if err := json.NewDecoder(r.Body).Decode(&logData); err != nil {
		http.Error(w, "Failed to decode JSON", http.StatusBadRequest)
		return
	}
	log.Printf("[HTTP] %s: %s", logData.Level, logData.Message)
	w.WriteHeader(http.StatusOK);
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
