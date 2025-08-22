package database

import (
	"fmt"
	"os"

	"github.com/glebarez/sqlite" // Pure go
	"gorm.io/gorm"
	"taskgo/internal/models"
)

var DB *gorm.DB

func ConnectDatabase() {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "taskgo.db"
	}

	database, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	err = database.AutoMigrate(&models.User{}, &models.Task{})
	if err != nil {
		panic(fmt.Sprintf("Failed to migrate database: %v", err))
	}

	DB = database
}
