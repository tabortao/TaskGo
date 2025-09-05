package database

import (
	"fmt"
	"os"
	"path/filepath"

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

	// 确保数据库目录存在
	if err := ensureDBDirectory(dbPath); err != nil {
		panic(fmt.Sprintf("Failed to create database directory: %v", err))
	}

	// 配置 SQLite 连接参数，解决内存问题
	dsn := dbPath + "?cache=shared&mode=rwc&_journal_mode=WAL&_synchronous=NORMAL&_cache_size=1000&_timeout=20000"
	database, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		// 禁用外键约束检查，避免潜在的内存问题
		DisableForeignKeyConstraintWhenMigrating: true,
	})
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

// ensureDBDirectory 确保数据库文件的目录存在
func ensureDBDirectory(dbPath string) error {
	// 获取数据库文件的目录路径
	dir := filepath.Dir(dbPath)
	
	// 如果目录不存在，创建它
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	
	return nil
}
