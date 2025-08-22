package database

import (
	"fmt"
	"github.com/glebarez/sqlite" // Pure go
	"gorm.io/gorm"
	"taskgo/internal/models"
)

var DB *gorm.DB

func ConnectDatabase() {
	database, err := gorm.Open(sqlite.Open("taskgo.db"), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	err = database.AutoMigrate(&models.User{}, &models.Task{})
	if err != nil {
		panic(fmt.Sprintf("Failed to migrate database: %v", err))
	}

	DB = database
}
