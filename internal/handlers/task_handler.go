package handlers

import (
	"fmt"
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

		var input map[string]interface{}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 只允许更新部分字段
		allowed := map[string]bool{"content": true, "tags": true, "completed": true, "pinned": true, "remark": true, "favorite": true, "images": true}
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
		id, err := strconv.Atoi(c.Param("id")) // 添加错误处理
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}

		// 查找任务
		if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		// 删除任务关联的图片文件
		if task.Images != "" {
			images := strings.Split(task.Images, ",")
			for _, imagePath := range images {
				if strings.TrimSpace(imagePath) != "" {
					// 构建完整的文件路径
					filePath := filepath.Join("web", "static", strings.TrimPrefix(strings.TrimSpace(imagePath), "/static/"))
					if err := os.Remove(filePath); err != nil {
						// 文件删除失败不影响任务删除，只记录错误
						fmt.Printf("Failed to delete image file %s: %v\n", filePath, err)
					}
				}
			}
		}

		// 删除任务
		if err := db.Delete(&task).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
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

// UploadTaskImages 上传任务图片
func UploadTaskImages(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		taskID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}

		// 验证任务是否属于当前用户
		var task models.Task
		if result := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		// 获取上传的文件
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
			return
		}

		files := form.File["images"]
		if len(files) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No images provided"})
			return
		}

        // 创建上传目录（按用户ID归档）
        uploadDir := filepath.Join("web", "static", "uploads", "tasks", fmt.Sprintf("%v", userID))
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		var imagePaths []string
		currentDate := time.Now().Format("20060102") // 格式：20250915

		// 处理每个上传的文件
		for _, file := range files {
			// 检查文件大小（限制为5MB）
			if file.Size > 5*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File %s exceeds 5MB limit", file.Filename)})
				return
			}

			// 检查文件类型
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File %s has unsupported format", file.Filename)})
				return
			}

			// 生成新文件名：年月日-原文件名
			originalName := strings.TrimSuffix(file.Filename, ext)
			newFileName := fmt.Sprintf("%s-%s%s", currentDate, originalName, ext)
            filePath := filepath.Join(uploadDir, newFileName)

			// 如果文件已存在，添加序号
			counter := 1
			for {
				if _, err := os.Stat(filePath); os.IsNotExist(err) {
					break
				}
				newFileName = fmt.Sprintf("%s-%s-%d%s", currentDate, originalName, counter, ext)
				filePath = filepath.Join(uploadDir, newFileName)
				counter++
			}

			// 保存文件
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save file %s", file.Filename)})
				return
			}

			// 添加到图片路径列表（存储相对路径）
            relativePath := "/static/uploads/tasks/" + fmt.Sprintf("%v", userID) + "/" + newFileName
            imagePaths = append(imagePaths, relativePath)
		}

		// 更新任务的图片字段
		existingImages := task.Images
		var allImages []string
		if existingImages != "" {
			allImages = strings.Split(existingImages, ",")
		}
		allImages = append(allImages, imagePaths...)

		// 更新数据库
		newImagesStr := strings.Join(allImages, ",")
		if err := db.Model(&task).Update("images", newImagesStr).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task images"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Images uploaded successfully",
			"images":  imagePaths,
			"total":   len(allImages),
		})
	}
}

// DeleteTaskImage 删除任务图片
func DeleteTaskImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		taskID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}

		var req struct {
			ImagePath string `json:"image_path" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 验证任务是否属于当前用户
		var task models.Task
		if err := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		// 检查图片是否属于该任务
		if task.Images == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "No images found for this task"})
			return
		}

		images := strings.Split(task.Images, ",")
		var newImages []string
		var found bool

		for _, img := range images {
			if strings.TrimSpace(img) == req.ImagePath {
				found = true
				// 删除物理文件
				filePath := filepath.Join("web", "static", strings.TrimPrefix(req.ImagePath, "/static/"))
				if err := os.Remove(filePath); err != nil {
					// 文件删除失败不影响数据库更新，只记录错误
					fmt.Printf("Failed to delete file %s: %v\n", filePath, err)
				}
			} else {
				newImages = append(newImages, strings.TrimSpace(img))
			}
		}

		if !found {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found in task"})
			return
		}

		// 更新数据库
		newImagesStr := strings.Join(newImages, ",")
		if err := db.Model(&task).Update("images", newImagesStr).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task images"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "Image deleted successfully",
			"remaining": len(newImages),
		})
	}
}
