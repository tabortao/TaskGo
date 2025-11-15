package router

import (
	"taskgo/internal/handlers"
	"taskgo/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
    r := gin.Default()
    r.SetTrustedProxies(nil) //取消Gin框架关于信任所有代理的警告信息

    r.Static("/static", "./web/static")
    r.LoadHTMLGlob("web/templates/*")

    r.GET("/", func(c *gin.Context) {
        c.HTML(200, "index.html", nil)
    })

    // 设置页面路由：返回独立的 settings.html
    r.GET("/settings", func(c *gin.Context) {
        c.HTML(200, "settings.html", nil)
    })

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register(db))
		api.POST("/login", handlers.Login(db))

		authed := api.Group("/")
		authed.Use(middleware.AuthMiddleware())
		{
			authed.GET("/user", handlers.GetUser(db))
			authed.PUT("/user/password", handlers.UpdatePassword(db))
			authed.POST("/user/avatar", handlers.UploadAvatar(db))

			authed.POST("/tasks", handlers.CreateTask(db))
			authed.GET("/tasks", handlers.GetTasks(db))
			authed.GET("/tasks/:id", handlers.GetTask(db))
			authed.PUT("/tasks/:id", handlers.UpdateTask(db))
			authed.DELETE("/tasks/:id", handlers.DeleteTask(db))
			authed.POST("/tasks/update-tags", handlers.UpdateTagForAllTasks(db))

			// 评论相关路由
			authed.GET("/tasks/:id/comments", handlers.GetTaskComments(db))
			authed.POST("/tasks/:id/comments", handlers.CreateTaskComment(db))

			// 图片上传相关路由
			authed.POST("/tasks/:id/images", handlers.UploadTaskImages(db))
			authed.DELETE("/tasks/:id/images", handlers.DeleteTaskImage(db))
		}
	}

	return r
}
