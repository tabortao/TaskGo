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
	Remark    string `json:"remark"`
	Pinned    bool   `gorm:"default:false" json:"pinned"`
	Favorite  bool   `gorm:"default:false" json:"favorite"`
	Images    string `json:"images"` // 存储图片路径，多个图片用逗号分隔
}

type Comment struct {
	gorm.Model
	TaskID  uint   `json:"task_id"`
	UserID  uint   `json:"user_id"`
	Content string `json:"content"`
	Task    Task   `gorm:"foreignKey:TaskID"`
	User    User   `gorm:"foreignKey:UserID"`
}

// SystemSetting 系统设置模型
type SystemSetting struct {
	gorm.Model
	Key   string `gorm:"unique" json:"key"`     // 设置键名
	Value string `json:"value"`                  // 设置值
}
