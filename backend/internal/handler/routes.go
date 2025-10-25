package handler

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/crudboxin/crudbox/internal/middleware"
)

type Server struct {
	userHandler         *UserHandler
	organisationHandler *OrganisationHandler
	projectHandler      *ProjectHandler
	endpointHandler     *EndpointHandler
}

func NewServer(
	userHandler *UserHandler,
	organisationHandler *OrganisationHandler,
	projectHandler *ProjectHandler,
	endpointHandler *EndpointHandler,
) *Server {
	return &Server{
		userHandler:         userHandler,
		organisationHandler: organisationHandler,
		projectHandler:      projectHandler,
		endpointHandler:     endpointHandler,
	}
}

func (s *Server) SetupRoutes() *gin.Engine {
	r := gin.Default()
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// Configure CORS middleware for all routes
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"*"},
		AllowWildcard:   true,
		ExposeHeaders:   []string{"Content-Length"},
		MaxAge:          12 * time.Hour,
	}))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Auth routes
	r.POST("/signup", s.userHandler.SignUp)
	r.POST("/login", s.userHandler.Login)

	// Protected routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/organisation", s.organisationHandler.CreateOrganisation)
		protected.GET("/organisations", s.organisationHandler.GetOrganisations)

		protected.POST("/project", s.projectHandler.CreateProject)
		protected.GET("/projects", s.projectHandler.GetProjects)
		protected.DELETE("/project/:project_uuid", s.projectHandler.DeleteProject)
		protected.POST("/project/:project_uuid/endpoint", s.endpointHandler.CreateEndpoint)
		protected.PUT("/project/:project_uuid/endpoint/:endpoint_uuid", s.endpointHandler.UpdateEndpoint)
		protected.GET("/project/:project_uuid/endpoints", s.endpointHandler.GetEndpoints)

		protected.DELETE("/endpoint/:endpoint_uuid", s.endpointHandler.DeleteEndpoint)

		protected.GET("/user", s.userHandler.GetByID)
	}

	// Mock endpoint (no auth required)
	r.Any("/:code/*path", s.endpointHandler.MockHandler)

	return r
}
