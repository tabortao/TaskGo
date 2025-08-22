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

WORKDIR /root/

# Copy the built binary from the builder stage
COPY --from=builder /app/taskgo .

# Copy the web assets (which includes the static folder)
COPY --from=builder /app/web ./web

# Expose port 8080
EXPOSE 8080

# Run the binary
CMD ["./taskgo"]