package middleware

import (
    "net/http"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "taskgo/internal/auth"
    "taskgo/internal/database"
    "taskgo/internal/models"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

        claims, err := auth.ValidateJWT(tokenString)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        if claims.StandardClaims.Id != "" {
            var tok models.APIToken
            if err := database.DB.Where("jti = ? AND revoked = ?", claims.StandardClaims.Id, false).First(&tok).Error; err != nil {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "Token revoked"})
                c.Abort()
                return
            }
            if time.Now().After(tok.ExpiresAt) {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
                c.Abort()
                return
            }
        }
        c.Set("userID", claims.UserID)
        c.Next()
    }
}
