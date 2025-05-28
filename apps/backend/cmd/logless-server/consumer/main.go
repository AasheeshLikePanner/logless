package main

import (
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"log"
	"fmt"
	"os"
)

var topics = []string{"logs"};

func main() {
	consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": "host1:9092,host2:9092",
		"group.id":          "foo",
		"auto.offset.reset": "smallest",
	})
	if err != nil {
		log.Fatalf("Failed to initialize kafka consumer: %v", err)
	}


	err = consumer.SubscribeTopics(topics, nil)
	if err!= nil {
		log.Fatalf("Failed to subscribe topic: %v", err)

	}
	run := true;
	for run {
		ev := consumer.Poll(100)
		switch e := ev.(type) {
		case *kafka.Message:
			// application-specific processing
		case kafka.Error:
			fmt.Fprintf(os.Stderr, "%% Error: %v\n", e)
			run = false
		default:
			fmt.Printf("Ignored %v\n", e)
		}
	}

	consumer.Close()
}
