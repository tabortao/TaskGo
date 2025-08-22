package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username  string `gorm:"unique" json:"username"`
	Password  string `json:"password"`
	AvatarURL string `json:"avatar_url"`
}

type Task struct {
	gorm.Model
	Content   string `json:"content"`
	Tags      string `json:"tags"`
	Completed bool   `gorm:"default:false" json:"completed"`
	UserID    uint   `json:"user_id"`
}
