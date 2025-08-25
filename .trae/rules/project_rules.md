# Trae.md

This file provides guidance to Trae (trae.ai) when working with code in this repository.
## 项目版本及依赖

go 1.24.1

```bash
require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/gin-gonic/gin v1.10.1
	github.com/glebarez/sqlite v1.11.0
	golang.org/x/crypto v0.41.0
	gorm.io/gorm v1.30.1
)
```

## Development Commands

```bash
# Build binary
go build -o taskgo.exe ./cmd/main.go
# Run the application
.\taskgo.exe 
# Run the application with hot reload
gin -a 8080 -p 8081 -b 127.0.0.1 -d ./cmd/main.go
```
