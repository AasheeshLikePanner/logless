package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aasheesh/logless/internal/domain"
	"github.com/aasheesh/logless/internal/models"
	"github.com/aasheesh/logless/internal/storage"
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var topics = "logs"

func main() {

	storage, err := storage.NewPostgresStorage("postgres://logless:logless@localhost:5432/logless")
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	service := domain.NewLogService(storage)

	consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092",
		"group.id":          "foo",
		"auto.offset.reset": "smallest",
	})
	if err != nil {
		log.Fatalf("Failed to initialize kafka consumer: %v", err)
	}

	err = consumer.Subscribe(topics, nil)
	if err != nil {
		log.Fatalf("Failed to subscribe topic: %v", err)
	}
	
	run := true
	ctx := context.Background();
	for run {
		ev := consumer.Poll(100)
		switch e := ev.(type) {
		case *kafka.Message:
			fmt.Printf("%% Message on %s:\n%s\n",
				e.TopicPartition, string(e.Value))
			var logEntry models.LogEntry
            err := json.Unmarshal(e.Value, &logEntry) 
			if err != nil {
                log.Printf("Error unmarshaling log entry: %v, Raw message: %s", err, string(e.Value))
                continue
            }
			err = service.ProcessLog(ctx, logEntry);
			if err != nil {
				log.Printf("Error while processing log entry: %s", err);
			}
		case kafka.Error:
			fmt.Fprintf(os.Stderr, "%% Error: %v\n", e)
			run = false
		}
	}
	consumer.Close()
}
