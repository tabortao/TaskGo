package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"taskgo/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UpdateTagForAllTasks 批量更新所有任务的某个标签
func UpdateTagForAllTasks(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			OldTag string `json:"oldTag"`
			NewTag string `json:"newTag"`
			Action string `json:"action"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Action != "update" || req.OldTag == "" || req.NewTag == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
			return
		}
		userID, _ := c.Get("userID")
		var tasks []models.Task
		db.Where("user_id = ?", userID).Find(&tasks)
		for _, task := range tasks {
			if task.Tags == "" {
				continue
			}
			tags := []string{}
			changed := false
			for _, tag := range splitTags(task.Tags) {
				if tag == req.OldTag {
					tags = append(tags, req.NewTag)
					changed = true
				} else {
					tags = append(tags, tag)
				}
			}
			if changed {
				db.Model(&task).Update("tags", joinTags(tags))
			}
		}
		c.JSON(http.StatusOK, gin.H{"message": "标签批量更新成功"})
	}
}

func splitTags(tags string) []string {
	res := []string{}
	for _, t := range strings.Split(tags, ",") {
		tt := strings.TrimSpace(t)
		if tt != "" {
			res = append(res, tt)
		}
	}
	return res
}
func joinTags(tags []string) string {
	return strings.Join(tags, ",")
}

// GetTask 获取单个任务详情
func GetTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var task models.Task
		userID, _ := c.Get("userID")
		id, _ := strconv.Atoi(c.Param("id"))

		if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": task})
	}
}

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

		var input map[string]interface{}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 只允许更新部分字段
        allowed := map[string]bool{"content": true, "tags": true, "completed": true, "pinned": true, "remark": true, "favorite": true}
		updateFields := make(map[string]interface{})
		for k, v := range input {
			if allowed[k] {
				updateFields[k] = v
			}
		}

		if len(updateFields) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No valid fields to update"})
			return
		}

		if err := db.Model(&task).Updates(updateFields).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
			return
		}
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

// GetTaskComments 获取任务的所有评论
func GetTaskComments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		taskID, _ := strconv.Atoi(c.Param("id"))

		// 验证任务是否属于当前用户
		var task models.Task
		if err := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		var comments []models.Comment
		db.Where("task_id = ?", taskID).Order("created_at asc").Find(&comments)

		c.JSON(http.StatusOK, gin.H{"data": comments})
	}
}

// CreateTaskComment 为任务添加评论
func CreateTaskComment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		taskID, _ := strconv.Atoi(c.Param("id"))

		// 验证任务是否属于当前用户
		var task models.Task
		if err := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		var input struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		comment := models.Comment{
			TaskID:  uint(taskID),
			UserID:  userID.(uint),
			Content: input.Content,
		}

		if err := db.Create(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": comment})
	}
}
