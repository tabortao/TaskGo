package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

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

// createTaskWithFiles 处理带文件上传的任务创建
func createTaskWithFiles(c *gin.Context, db *gorm.DB) {
	// 获取表单数据
	content := c.PostForm("content")
	tags := c.PostForm("tags")

	// 检查是否有图片上传
	form, err := c.MultipartForm()
	hasImages := err == nil && form.File["images"] != nil && len(form.File["images"]) > 0

	// 如果既没有内容也没有图片，则返回错误
	if content == "" && !hasImages {
		c.JSON(http.StatusBadRequest, gin.H{"error": "任务内容或图片至少需要提供一项"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}

	// 处理图片上传
	var imagePaths []string
	if hasImages {
		// 确保图片目录存在
		imageDir := "web/static/images/tasks"
		if err := os.MkdirAll(imageDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建图片目录失败"})
			return
		}

		// 处理每个上传的图片
		for i, fileHeader := range form.File["images"] {
			// 生成基于时间戳和索引的唯一文件名（YYYYMMDDHHMMSS_index格式）
			timestamp := time.Now().Format("20060102150405") // 使用YYYYMMDDHHMMSS格式
			ext := filepath.Ext(fileHeader.Filename) // 获取原文件扩展名
			filename := fmt.Sprintf("%s_%d%s", timestamp, i+1, ext) // 时间格式文件名加索引
			filePath := filepath.Join(imageDir, filename)

			// 打开上传的文件
			file, err := fileHeader.Open()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "打开上传文件失败"})
				return
			}
			defer file.Close()

			// 创建目标文件
			dst, err := os.Create(filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文件失败"})
				return
			}
			defer dst.Close()

			// 复制文件内容
			if _, err := io.Copy(dst, file); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
				return
			}

			// 保存相对路径用于数据库存储
			relativePath := "/static/images/tasks/" + filename
			imagePaths = append(imagePaths, relativePath)
		}
	}

	// 创建任务
	task := models.Task{
		Content: content,
		Tags:    tags,
		UserID:  userID.(uint),
		Images:  strings.Join(imagePaths, ","), // 多个图片路径用逗号分隔
	}

	if err := db.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建任务失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": task})
}

func CreateTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否为multipart/form-data请求
		contentType := c.GetHeader("Content-Type")
		if strings.Contains(contentType, "multipart/form-data") {
			// 处理带文件上传的请求
			createTaskWithFiles(c, db)
			return
		}

		// 处理普通JSON请求
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
		// var tasks []models.Task
		userID, _ := c.Get("userID")

		// 查询任务并计算评论数量
		type TaskWithCommentCount struct {
			models.Task
			CommentCount int64 `json:"comment_count"`
		}

		var tasksWithCount []TaskWithCommentCount
		db.Table("tasks").
			Select("tasks.*, COUNT(comments.id) as comment_count").
			Joins("LEFT JOIN comments ON tasks.id = comments.task_id").
			Where("tasks.user_id = ?", userID).
			Group("tasks.id").
			Order("tasks.created_at desc").
			Find(&tasksWithCount)

		c.JSON(http.StatusOK, gin.H{"data": tasksWithCount})
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

		// 检查请求类型，支持 FormData 和 JSON 两种格式
		contentType := c.GetHeader("Content-Type")
		updateFields := make(map[string]interface{})
		allowed := map[string]bool{"content": true, "tags": true, "completed": true, "pinned": true, "remark": true, "favorite": true, "images": true}

		if strings.Contains(contentType, "multipart/form-data") {
			// 处理 FormData 格式（包含文件上传）
			content := c.PostForm("content")
			existingImages := c.PostForm("images")
			
			// 处理新增图片文件
			form, err := c.MultipartForm()
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "解析表单失败"})
				return
			}

			var newImagePaths []string
			if files := form.File["newImages"]; len(files) > 0 {
				// 确保上传目录存在
				uploadDir := "web/static/images/tasks"
				if err := os.MkdirAll(uploadDir, 0755); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "创建上传目录失败"})
					return
				}

				for _, fileHeader := range files {
					// 生成唯一文件名
					ext := filepath.Ext(fileHeader.Filename)
					filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), strings.ReplaceAll(fileHeader.Filename, ext, ""), ext)
					filePath := filepath.Join(uploadDir, filename)

					// 保存文件
					if err := c.SaveUploadedFile(fileHeader, filePath); err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
						return
					}

					// 保存相对路径用于数据库存储
					relativePath := "/static/images/tasks/" + filename
					newImagePaths = append(newImagePaths, relativePath)
				}
			}

			// 合并现有图片和新增图片
			allImages := []string{}
			if existingImages != "" {
				allImages = append(allImages, strings.Split(existingImages, ",")...)
			}
			allImages = append(allImages, newImagePaths...)

			// 设置更新字段
			updateFields["content"] = content
			updateFields["images"] = strings.Join(allImages, ",")
		} else {
			// 处理 JSON 格式
			var input map[string]interface{}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// 只允许更新部分字段
			for k, v := range input {
				if allowed[k] {
					updateFields[k] = v
				}
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

		// 删除任务关联的图片文件
		if task.Images != "" {
			imagePaths := strings.Split(task.Images, ",")
			for _, imagePath := range imagePaths {
				imagePath = strings.TrimSpace(imagePath)
				if imagePath != "" {
					// 构建完整的文件路径
					fullPath := filepath.Join("web", "static", "images", "tasks", filepath.Base(imagePath))
					// 删除文件，忽略错误（文件可能已经不存在）
					os.Remove(fullPath)
				}
			}
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
		db.Preload("User").Where("task_id = ?", taskID).Order("created_at asc").Find(&comments)

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
