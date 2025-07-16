package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	
	"valouniversaire/internal/web"
)

const (
	defaultPort = "8080"
	defaultHost = "localhost"
)

func main() {
	var (
		port = flag.String("port", getEnv("PORT", defaultPort), "Server port")
		host = flag.String("host", getEnv("HOST", defaultHost), "Server host")
		dev  = flag.Bool("dev", false, "Development mode")
	)
	flag.Parse()

	server := web.NewServer()
	mux := server.SetupRoutes()

	addr := fmt.Sprintf("%s:%s", *host, *port)
	
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("🌳 Valouniversaire server starting...")
	log.Printf("🌐 Server listening on http://%s", addr)
	if *dev {
		log.Printf("🔧 Development mode enabled")
	}
	log.Printf("📋 Available endpoints:")
	log.Printf("   GET  /                 - Game interface")
	log.Printf("   GET  /api/state        - Get game state")
	log.Printf("   POST /api/action       - Perform game action")
	log.Printf("   GET  /api/scores       - Get player scores")
	log.Printf("   POST /api/reset        - Reset player game")
	log.Printf("   GET  /api/health       - Health check")
	log.Printf("   GET  /static/*         - Static files")

	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server failed to start: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	log.Println("🛑 Server shutting down...")

	log.Println("✅ Server stopped gracefully")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}