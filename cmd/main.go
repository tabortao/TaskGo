package main

import (
	"taskgo/internal/database"
	"taskgo/internal/router"
)

func main() {
	database.ConnectDatabase()
	r := router.SetupRouter()
	r.Run(":8080")
}
