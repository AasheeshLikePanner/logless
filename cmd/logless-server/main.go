package main

import (
	"net/http"
	"log"
	"syscall"
	"os/signal"
	"os"
	"github.com/aasheesh/logless/internal/api"
)

func main(){

	mux := http.NewServeMux();

	//routes
	mux.HandleFunc("/api/logs", api.HttpLogHandler);
	mux.HandleFunc("/api/health", api.HealthCheckHandler);

	//server configuration
	server := &http.Server{
		Addr: ":8080",
		Handler: mux,
	}

	go func () {
		log.Println("Starting server on :8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	
	// Graceful shutdown
	quit := make(chan os.Signal, 1);
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
    server.Close()

}