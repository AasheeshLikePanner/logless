package producer

import (
	"github.com/aasheesh/logless/internal/models"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"log"
	"fmt"
)

type LogProducer struct{
	kafka *kafka.Producer;
}

func NewLogProducer(kafka *kafka.Producer) *LogProducer {
	return &LogProducer{kafka: kafka}
}

func (lp *LogProducer) SendLog(logEntry models.LogEntry) error{
	value := []byte(fmt.Sprintf("%+v", logEntry))

	topic := "log";

	err := lp.kafka.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Value:value ,
	}, nil);
	if err != nil {
		if err.(kafka.Error).Code() == kafka.ErrQueueFull {
			// Producer queue is full, handle this (e.g., retry or log)
			log.Printf("Producer queue full for log: %v", err)
		} else {
			log.Printf("Failed to produce log message: %v", err)
		}
		return err
	}
	fmt.Printf("Enqueued log message for topic %s\n", topic)
	return nil;
}

func (lp *LogProducer) StartEventConsumer() {
	go func() {
		for e := range lp.kafka.Events() { 
			switch ev := e.(type) {
			case *kafka.Message:
				if ev.TopicPartition.Error != nil {
					log.Printf("Delivery failed: %v", ev.TopicPartition.Error)
				} else {
					log.Printf("Delivered message to topic %s [%d] at offset %v",
						*ev.TopicPartition.Topic,
						ev.TopicPartition.Partition,
						ev.TopicPartition.Offset)
				}
			case kafka.Error:
				log.Printf("Kafka Error: %v", ev)
			}
		}
	}()
}