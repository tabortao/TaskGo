package handlers

import (
    "net/http"
    "time"
    "crypto/rand"
    "encoding/hex"

    "taskgo/internal/auth"
    "taskgo/internal/models"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func randomJTI() (string, error) {
    b := make([]byte, 16)
    if _, err := rand.Read(b); err != nil { return "", err }
    return hex.EncodeToString(b), nil
}

func ListTokens(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, _ := c.Get("userID")
        var tokens []models.APIToken
        db.Where("user_id = ?", userID).Order("created_at desc").Find(&tokens)
        c.JSON(http.StatusOK, gin.H{"data": tokens})
    }
}

func CreateToken(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, _ := c.Get("userID")
        var req struct{ Duration string `json:"duration"` }
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
        var d time.Duration
        switch req.Duration {
        case "1d": d = 24 * time.Hour
        case "1m": d = 30 * 24 * time.Hour
        case "1y": d = 365 * 24 * time.Hour
        case "permanent": d = 10 * 365 * 24 * time.Hour
        default: d = 30 * 24 * time.Hour
        }
        jti, err := randomJTI(); if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to generate id"}); return }
        expires := time.Now().Add(d)
        token, err := auth.GenerateJWTWithExpiry(userID.(uint), expires, jti)
        if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to generate token"}); return }
        rec := models.APIToken{ UserID: userID.(uint), JTI: jti, Token: token, ExpiresAt: expires, Revoked: false }
        if err := db.Create(&rec).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to save token"}); return }
        c.JSON(http.StatusOK, gin.H{"data": rec})
    }
}

func UpdateToken(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, _ := c.Get("userID")
        var tok models.APIToken
        if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&tok).Error; err != nil { c.JSON(http.StatusNotFound, gin.H{"error":"Token not found"}); return }
        var req struct{ Duration string `json:"duration"`; Revoked *bool `json:"revoked"` }
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
        if req.Duration != "" {
            var d time.Duration
            switch req.Duration {
            case "1d": d = 24 * time.Hour
            case "1m": d = 30 * 24 * time.Hour
            case "1y": d = 365 * 24 * time.Hour
            case "permanent": d = 10 * 365 * 24 * time.Hour
            default: d = 30 * 24 * time.Hour
            }
            jti, _ := randomJTI()
            expires := time.Now().Add(d)
            token, err := auth.GenerateJWTWithExpiry(tok.UserID, expires, jti)
            if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to generate token"}); return }
            tok.JTI = jti
            tok.Token = token
            tok.ExpiresAt = expires
        }
        if req.Revoked != nil { tok.Revoked = *req.Revoked }
        if err := db.Save(&tok).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to update token"}); return }
        c.JSON(http.StatusOK, gin.H{"data": tok})
    }
}

func DeleteToken(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, _ := c.Get("userID")
        var tok models.APIToken
        if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&tok).Error; err != nil { c.JSON(http.StatusNotFound, gin.H{"error":"Token not found"}); return }
        tok.Revoked = true
        if err := db.Save(&tok).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to revoke token"}); return }
        c.JSON(http.StatusOK, gin.H{"message":"Token revoked"})
    }
}