package handlers

import (
	"net/http"
	"strconv"

	"taskgo/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.Task
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userID, _ := c.Get("userID")
		task := models.Task{Content: input.Content, Tags: input.Tags, UserID: userID.(uint)}
		db.Create(&task)

		c.JSON(http.StatusOK, gin.H{"data": task})
	}
}

func GetTasks(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tasks []models.Task
		userID, _ := c.Get("userID")

		db.Where("user_id = ?", userID).Order("created_at desc").Find(&tasks)

		c.JSON(http.StatusOK, gin.H{"data": tasks})
	}
}

func UpdateTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var task models.Task
		userID, _ := c.Get("userID")
		id, _ := strconv.Atoi(c.Param("id"))

		if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		var input models.Task
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		db.Model(&task).Updates(input)
		c.JSON(http.StatusOK, gin.H{"data": task})
	}
}

func DeleteTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var task models.Task
		userID, _ := c.Get("userID")
		id, _ := strconv.Atoi(c.Param("id"))

		if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		db.Delete(&task)
		c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
	}
}
