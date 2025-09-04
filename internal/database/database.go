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

	err = database.AutoMigrate(&models.User{}, &models.Task{}, &models.Comment{}, &models.SystemSetting{})
	if err != nil {
		panic(fmt.Sprintf("Failed to migrate database: %v", err))
	}

	// 初始化系统设置默认值
	initializeSystemSettings(database)

	DB = database
}

// initializeSystemSettings 初始化系统设置默认值
func initializeSystemSettings(db *gorm.DB) {
	// 检查是否已存在注册开关设置
	var setting models.SystemSetting
	result := db.Where("key = ?", "allow_registration").First(&setting)
	if result.Error != nil {
		// 如果不存在，创建默认设置（允许注册）
		defaultSetting := models.SystemSetting{
			Key:   "allow_registration",
			Value: "true", // 默认允许注册
		}
		db.Create(&defaultSetting)
	}
}
