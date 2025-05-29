package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/aasheesh/logless/internal/domain"
	producer "github.com/aasheesh/logless/internal/kafka"
	"github.com/aasheesh/logless/internal/models"
	"github.com/gorilla/mux"
)

type LogHandler struct {
	service *domain.LogService
	producer *producer.LogProducer
}

func NewLogHandler(service *domain.LogService, producer *producer.LogProducer) *LogHandler {
	return &LogHandler{service: service, producer: producer}
}

func (h *LogHandler) LogHandler(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()

	var entry models.LogEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	if err:= h.producer.SendLog(entry); err != nil{
		respondWithError(w,http.StatusInternalServerError, "failed to send log to Kafka")
	}

	respondWithJSON(w, http.StatusCreated, map[string]string{"message": "log stored successfully"})
}

func (h *LogHandler) GetPaginatedLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	response, err := h.service.GetPaginatedLogs(ctx, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, response)
}

func (h *LogHandler) GetLevelLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	level := vars["level"]

	logs, err := h.service.GetLevelLogs(ctx, level)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, logs)
}

func (h *LogHandler) GetSearchLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	searchTerm := vars["rest"]

	logs, err := h.service.GetSearchLogs(ctx, searchTerm)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, logs)
}

func (h *LogHandler) SetLevelColors(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	level := vars["level"]

	var colorEntry models.ColorEntry
	if err := json.NewDecoder(r.Body).Decode(&colorEntry); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	if err := h.service.SetLevelColors(ctx, level, colorEntry.Color); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "level color updated successfully"})
}

func (h *LogHandler) GetLevelColors(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	colors, err := h.service.GetLevelColors(ctx)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, colors)
}

func (h *LogHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	health, err := h.service.HealthCheck(ctx)
	if err != nil {
		respondWithError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, health)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}