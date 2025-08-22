package router

import (
	"github.com/gin-gonic/gin"
	"taskgo/internal/handlers"
	"taskgo/internal/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Static("/static", "./web/static")
	r.LoadHTMLGlob("web/templates/*")

	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
	})

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		authed := api.Group("/")
		authed.Use(middleware.AuthMiddleware())
		{
			authed.POST("/tasks", handlers.CreateTask)
			authed.GET("/tasks", handlers.GetTasks)
			authed.PUT("/tasks/:id", handlers.UpdateTask)
			authed.DELETE("/tasks/:id", handlers.DeleteTask)
		}
	}

	return r
}
