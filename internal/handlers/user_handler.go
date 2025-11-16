package handlers

import (
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "time"
    "strings"
    "io"
    "bytes"
    "image/jpeg"

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

        uploadDir := filepath.Join("web", "static", "uploads", "avatars", fmt.Sprintf("%v", userID))
        if err := os.MkdirAll(uploadDir, 0755); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
            return
        }

        ext := strings.ToLower(filepath.Ext(file.Filename))
        ts := time.Now().Format("20060102150405")
        var finalName string
        var finalPath string

        f, err := file.Open()
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
            return
        }
        defer f.Close()

        if ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" || ext == ".jpg" {
            finalName = fmt.Sprintf("avatar-%s%s", ts, ext)
            finalPath = filepath.Join(uploadDir, finalName)
            out, err := os.Create(finalPath)
            if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"}); return }
            defer out.Close()
            if _, err := io.Copy(out, f); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file"}); return }
        } else {
            buf := new(bytes.Buffer)
            if _, err := io.Copy(buf, f); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"}); return }
            img, err := jpeg.Decode(bytes.NewReader(buf.Bytes()))
            if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported image format"}); return }
            finalName = fmt.Sprintf("avatar-%s.jpeg", ts)
            finalPath = filepath.Join(uploadDir, finalName)
            out, err := os.Create(finalPath)
            if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"}); return }
            defer out.Close()
            if err := jpeg.Encode(out, img, &jpeg.Options{Quality: 85}); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode image"}); return }
        }

        avatarURL := "/static/uploads/avatars/" + fmt.Sprintf("%v", userID) + "/" + finalName

        var user models.User
        db.First(&user, userID)
        db.Model(&user).Update("avatar_url", avatarURL)

        c.JSON(http.StatusOK, gin.H{"data": gin.H{"avatar_url": avatarURL}})
    }
}