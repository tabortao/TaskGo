package models

import (
	"gorm.io/gorm"
)

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
	Remark    string `json:"remark"`
	Pinned    bool   `gorm:"default:false" json:"pinned"`
	Favorite  bool   `gorm:"default:false" json:"favorite"`
	Images    string `json:"images"` // 存储图片路径，多个路径用逗号分隔
}

type Comment struct {
	gorm.Model
	TaskID  uint   `json:"task_id"`
	UserID  uint   `json:"user_id"`
	Content string `json:"content"`
	Task    Task   `gorm:"foreignKey:TaskID"`
	User    User   `gorm:"foreignKey:UserID"`
}
