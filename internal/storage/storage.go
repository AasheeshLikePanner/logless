package storage

import (
	"context"
	"log"
	"github.com/jackc/pgx/v5/pgxpool"
	"fmt"
)

var DB *pgxpool.Pool

func InitPostgres(){
	connStr := "postgres://logless:logless@localhost:5432/logless"
	var err error;
	DB, err = pgxpool.New(context.Background(), connStr);
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err);
	}
}

func SaveLog(level string, data []byte, jsonData []byte) error {
	// Correctly passing context.Background() as the first argument
	_, err := DB.Exec(context.Background(), 
		`INSERT INTO logs (level, compressed_data, log_text) VALUES ($1, $2, to_tsvector($3))`,
		level, data, string(jsonData))
	return err
}


func GetLevelLogs(level string) ([]byte, error) {
    rows, err := DB.Query(context.Background(),
        "SELECT level, compressed_data FROM logs WHERE level = $1", level,
    )
    if err != nil {
        return nil, fmt.Errorf("unable to execute query: %v", err)
    }
    defer rows.Close()

    var allLogs []byte
    for rows.Next() {
        var logLevel string // Renamed to avoid conflict
        var data []byte
        if err := rows.Scan(&logLevel, &data); err != nil {
            return nil, fmt.Errorf("unable to scan row: %v", err)
        }

        // Optionally, you can append the decompressed data to a slice of logs
        allLogs = append(allLogs, data...)
    }

    if len(allLogs) == 0 {
        return nil, fmt.Errorf("no logs found for level: %s", level)
    }

    return allLogs, nil
}

func GetAllLogs() ([][]byte, error) {
    rows, err := DB.Query(context.Background(), "SELECT compressed_data FROM logs")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var logs [][]byte
    for rows.Next() {
        var data []byte
        if err := rows.Scan(&data); err != nil {
            return nil, err
        }
        logs = append(logs, data)
    }
    log.Println("Fetched all logs from the database", logs);
    return logs, nil
}
