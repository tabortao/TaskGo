package main

import (
	"taskgo/internal/database"
	"taskgo/internal/router"
)

func main() {
	database.ConnectDatabase()
	r := router.SetupRouter(database.DB)
	r.Run(":8080")
}
