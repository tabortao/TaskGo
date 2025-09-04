# Stage 1: Build the Go application
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the application
# Using the pure Go sqlite driver, so CGO is not needed.
RUN go build -o taskgo ./cmd/main.go

# Stage 2: Create the final lightweight image
FROM alpine:latest

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# 创建应用运行用户（非root用户，提高安全性）
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy the built binary from the builder stage
COPY --from=builder /app/taskgo .

# Copy the web assets (which includes the static folder)
COPY --from=builder /app/web ./web

# 创建数据存储目录
RUN mkdir -p /app/db && \
    mkdir -p /app/web/static/images/tasks && \
    mkdir -p /app/web/static/avatars && \
    mkdir -p /app/web/static/attachments

# 设置目录权限，确保应用用户可以读写
RUN chown -R appuser:appgroup /app && \
    chmod -R 755 /app && \
    chmod -R 775 /app/db && \
    chmod -R 775 /app/web/static/images && \
    chmod -R 775 /app/web/static/avatars && \
    chmod -R 775 /app/web/static/attachments

# 切换到非root用户
USER appuser

# Expose port 8080
EXPOSE 8080

# Run the binary
CMD ["./taskgo"]