package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/aasheesh/logless/internal/api"
	"github.com/aasheesh/logless/internal/domain"
	"github.com/aasheesh/logless/internal/storage"
)

// Concrete implementation of Storage interface for Postgres
type PostgresStorage struct{}

func (p *PostgresStorage) Save(level string, data []byte, jsonData []byte) error {
	return storage.SaveLog(level, data, jsonData)
}

func (p *PostgresStorage) GetAllLogs() ([][]byte, error) {  // FIX: return slice of logs
	return storage.GetAllLogs()
}
func (p *PostgresStorage) GetLevelLogs(level string) ([][]byte, error) {  // FIX: return slice of logs
	return storage.GetAllLogs()
}

func main() {

	// Initialize DB
	storage.InitPostgres()

	// Wire storage with processor
	pgStorage := &PostgresStorage{}
	processor := domain.New(pgStorage)

	// Create API handler
	handler := api.NewLogHandler(processor)

	// Router setup
	mux := http.NewServeMux()
	mux.Handle("/api/log", withCORS(http.HandlerFunc(handler.HttpLogHandler)))   // Save log
	mux.HandleFunc("/api/logs", handler.HttpGetAllLogs)    // Get all logs
	mux.HandleFunc("/api/health", api.HealthCheckHandler)  // Healthcheck

	// Server setup
	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Start server in goroutine
	go func() {
		log.Println("Starting server on :8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	server.Close() // clean shutdown
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Or specific origin in production
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
