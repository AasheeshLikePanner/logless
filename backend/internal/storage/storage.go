package storage

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func InitPostgres() {
	connStr := "postgres://logless:logless@localhost:5432/logless"
	var err error
	DB, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
}

func SaveLog(level string, data []byte, jsonData []byte) error {
	// Correctly passing context.Background() as the first argument
	log.Printf("Saving log with level: %s", level)
	_, err := DB.Exec(context.Background(),
		`INSERT INTO logs (level, compressed_data, log_text) VALUES ($1, $2, to_tsvector($3))`,
		level, data, string(jsonData))
	return err
}

func GetLevelLogs(level string) ([][]byte, error) {
	rows, err := DB.Query(context.Background(),
		"SELECT compressed_data FROM logs WHERE level = $1", level,
	)
	if err != nil {
		return nil, fmt.Errorf("unable to execute query: %v", err)
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var data []byte
		if err := rows.Scan(&data); err != nil {
			return nil, fmt.Errorf("unable to scan row: %v", err)
		}
		logs = append(logs, data)
	}

	if len(logs) == 0 {
		return nil, fmt.Errorf("no logs found for level: %s", level)
	}

	return logs, nil
}

func GetAllLogs() ([][]byte, error) {
	// Change the query to include both level and compressed_data
	rows, err := DB.Query(context.Background(), "SELECT level, compressed_data FROM logs")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var level string
		var data []byte
		if err := rows.Scan(&level, &data); err != nil {
			return nil, err
		}
		logs = append(logs, data)
	}
	return logs, nil
}

func GetSearchLogs(searchTerm string) ([][]byte, error) {
	log.Printf("Searching logs with term: %s", searchTerm)
	// Change the query to include both level and compressed_data
	rows, err := DB.Query(context.Background(),
		"SELECT level, compressed_data FROM logs WHERE log_text @@ to_tsquery($1)",
		searchTerm)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs [][]byte
	for rows.Next() {
		var level string
		var data []byte
		if err := rows.Scan(&level, &data); err != nil {
			return nil, err
		}
		logs = append(logs, data)
	}
	return logs, nil
}
