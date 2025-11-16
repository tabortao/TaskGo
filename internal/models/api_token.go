package models

import "time"

type APIToken struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    uint      `gorm:"index"`
    Name      string    `gorm:"size:128"`
    JTI       string    `gorm:"uniqueIndex;size:64"`
    Token     string    `gorm:"size:1024"`
    ExpiresAt time.Time `gorm:"index"`
    Revoked   bool      `gorm:"default:false"`
    CreatedAt time.Time
}