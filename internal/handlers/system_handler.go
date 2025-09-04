package handlers

import (
	"net/http"
	"taskgo/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetSystemSettings 获取系统设置
func GetSystemSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings []models.SystemSetting
		if err := db.Find(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system settings"})
			return
		}

		// 转换为map格式方便前端使用
		settingsMap := make(map[string]string)
		for _, setting := range settings {
			settingsMap[setting.Key] = setting.Value
		}

		c.JSON(http.StatusOK, gin.H{"data": settingsMap})
	}
}

// UpdateSystemSetting 更新系统设置
func UpdateSystemSetting(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Key   string `json:"key" binding:"required"`
			Value string `json:"value" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 查找现有设置
		var setting models.SystemSetting
		result := db.Where("key = ?", input.Key).First(&setting)
		if result.Error != nil {
			// 如果不存在，创建新设置
			setting = models.SystemSetting{
				Key:   input.Key,
				Value: input.Value,
			}
			if err := db.Create(&setting).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create setting"})
				return
			}
		} else {
			// 如果存在，更新设置
			if err := db.Model(&setting).Update("value", input.Value).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Setting updated successfully", "data": setting})
	}
}

// CheckRegistrationAllowed 检查是否允许注册（中间件函数）
func CheckRegistrationAllowed(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var setting models.SystemSetting
		result := db.Where("key = ?", "allow_registration").First(&setting)
		if result.Error != nil || setting.Value != "true" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Registration is currently disabled"})
			c.Abort()
			return
		}
		c.Next()
	}
}