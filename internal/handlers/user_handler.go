package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"taskgo/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type PasswordInput struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

func GetUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func UpdatePassword(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var input PasswordInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid current password"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		db.Model(&user).Update("password", string(hashedPassword))

		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
	}
}

func UploadAvatar(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		file, err := c.FormFile("avatar")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File not provided"})
			return
		}

		if file.Size > 1*1024*1024 { // 1MB
			c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 1MB"})
			return
		}

		ext := filepath.Ext(file.Filename)
		newFileName := fmt.Sprintf("%d%s", userID, ext)
		filePath := filepath.Join("web", "static", "avatars", newFileName)

		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
			return
		}

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		avatarURL := "/static/avatars/" + newFileName

		var user models.User
		db.First(&user, userID)
		db.Model(&user).Update("avatar_url", avatarURL)

		c.JSON(http.StatusOK, gin.H{"data": gin.H{"avatar_url": avatarURL}})
	}
}