package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"taskgo/internal/database"
	"taskgo/internal/models"
)

func CreateTask(c *gin.Context) {
	var input models.Task
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	task := models.Task{Content: input.Content, Tags: input.Tags, UserID: userID.(uint)}
	database.DB.Create(&task)

	c.JSON(http.StatusOK, gin.H{"data": task})
}

func GetTasks(c *gin.Context) {
	var tasks []models.Task
	userID, _ := c.Get("userID")

	database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&tasks)

	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func UpdateTask(c *gin.Context) {
	var task models.Task
	userID, _ := c.Get("userID")
	id, _ := strconv.Atoi(c.Param("id"))

	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var input models.Task
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&task).Updates(input)
	c.JSON(http.StatusOK, gin.H{"data": task})
}

func DeleteTask(c *gin.Context) {
	var task models.Task
	userID, _ := c.Get("userID")
	id, _ := strconv.Atoi(c.Param("id"))

	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	database.DB.Delete(&task)
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
