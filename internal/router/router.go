package router

import (
	"taskgo/internal/handlers"
	"taskgo/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	r.Static("/static", "./web/static")
	r.LoadHTMLGlob("web/templates/*")

	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
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
		}
	}

	return r
}
