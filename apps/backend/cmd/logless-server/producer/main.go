package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aasheesh/logless/internal/api"
	"github.com/aasheesh/logless/internal/domain"
	producer "github.com/aasheesh/logless/internal/kafka"
	"github.com/aasheesh/logless/internal/storage"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/gorilla/mux"
)

func main() {
	// Initialize storage
	storage, err := storage.NewPostgresStorage("postgres://logless:logless@localhost:5432/logless")
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	var producerConfigMap *kafka.ConfigMap = &kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092",
		"client.id":         "my-go-async-producer",
		"acks":              "all",
	}

	p, err := kafka.NewProducer(producerConfigMap)

	if err != nil {
		// log.Fatalf prints a fatal error and exits the program.
		log.Fatalf("Failed to create producer: %v", err)
	}

	defer func() {
		log.Println("Flushing producer outstanding messages...")
		remaining := p.Flush(10 * 1000)
		log.Printf("Flushed %d outstanding messages.", remaining)
		p.Close()
	}() 

	// Initialize service
	service := domain.NewLogService(storage)

	producer := producer.NewLogProducer(p)

	// Initialize API handlers
	handler := api.NewLogHandler(service, producer)

	// Router setup
	router := mux.NewRouter()
	router.Handle("/api/log", http.HandlerFunc(handler.LogHandler)).Methods("POST")
	router.Handle("/api/logs", http.HandlerFunc(handler.GetPaginatedLogs)).Methods("GET")
	router.Handle("/api/health", http.HandlerFunc(handler.HealthCheck)).Methods("GET")
	router.Handle("/api/logs/level/colors", http.HandlerFunc(handler.GetLevelColors)).Methods("GET")
	router.Handle("/api/logs/level/colors/{level}", http.HandlerFunc(handler.SetLevelColors)).Methods("POST")
	router.Handle("/api/logs/level/{level}", http.HandlerFunc(handler.GetLevelLogs)).Methods("GET")
	router.Handle("/api/logs/search/{rest:.*}", http.HandlerFunc(handler.GetSearchLogs)).Methods("GET")
	router.Handle("/api/logs/by-date", http.HandlerFunc(handler.GetDateLogs)).Methods("GET")

	// Server setup
	server := &http.Server{
		Addr:         ":8080",
		Handler:      withCORS(router),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	// Graceful shutdown
	done := make(chan bool)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Server is shutting down...")

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Fatalf("Could not gracefully shutdown the server: %v\n", err)
		}
		close(done)
	}()

	log.Println("Server is ready to handle requests at :8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on :8080: %v\n", err)
	}

	<-done
	log.Println("Server stopped")
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
