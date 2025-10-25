package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"

	"github.com/aws/aws-lambda-go/events"

	"github.com/crudboxin/crudbox/internal/database"
	"github.com/crudboxin/crudbox/internal/handler"
	"github.com/crudboxin/crudbox/internal/middleware"
	"github.com/crudboxin/crudbox/internal/repository"
	"github.com/crudboxin/crudbox/internal/service"
	"github.com/crudboxin/crudbox/pkg/config"
)

func main() {
	runMigrations := flag.Bool("run-migrations", false, "apply database migrations before starting the server")
	flag.Parse()

	// Load configuration
	cfg := config.Load()

	// Initialize database
	dbConfig := &database.Config{
		Host:     cfg.DB.Host,
		Port:     cfg.DB.Port,
		User:     cfg.DB.User,
		Password: cfg.DB.Password,
		DBName:   cfg.DB.DBName,
		SSLMode:  cfg.DB.SSLMode,
	}

	db, err := database.NewConnection(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if *runMigrations {
		if err := database.RunMigrations(db); err != nil {
			log.Fatal("Failed to run database migrations:", err)
		}
	}

	// Set JWT secret for middleware
	middleware.SetJWTSecret([]byte(cfg.JWTSecret))

	// Initialize repositories
	repos := repository.NewRepositories(db)

	// Initialize services
	services := service.NewServices(repos, []byte(cfg.JWTSecret))

	// Initialize handlers
	userHandler := handler.NewUserHandler(services.User)
	organisationHandler := handler.NewOrganisationHandler(services.Organisation)
	projectHandler := handler.NewProjectHandler(services.Project)
	endpointHandler := handler.NewEndpointHandler(services.Endpoint, services.Project)

	// Setup server
	server := handler.NewServer(
		userHandler,
		organisationHandler,
		projectHandler,
		endpointHandler,
	)

	// Setup routes and start server
	router := server.SetupRoutes()

	if isLambdaRuntime() {
		adapter := ginadapter.NewV2(router)
		lambda.Start(func(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
			return adapter.ProxyWithContext(ctx, req)
		})
		return
	}

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func isLambdaRuntime() bool {
	return os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" || os.Getenv("LAMBDA_TASK_ROOT") != ""
}
