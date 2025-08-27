package main

import (
	"taskgo/internal/database"
	"taskgo/internal/router"

	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.ReleaseMode) //正式发布阶段使用
	database.ConnectDatabase()
	r := router.SetupRouter(database.DB)
	r.Run(":8080")
}
