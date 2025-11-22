package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/service"
)

type EndpointHandler struct {
	service        service.EndpointService
	projectService service.ProjectService
}

func NewEndpointHandler(service service.EndpointService, projectService service.ProjectService) *EndpointHandler {
	return &EndpointHandler{
		service:        service,
		projectService: projectService,
	}
}

func (h *EndpointHandler) CreateEndpoint(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectUUID := c.Param("project_uuid")
	if projectUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project UUID"})
		return
	}

	var req contracts.CreateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	endpoint, err := h.service.CreateEndpoint(&req, projectUUID, userID.(int))
	if err != nil {
		switch err.Error() {
		case "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "endpoint with same method and path already exists":
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"endpoint": endpoint})
}

func (h *EndpointHandler) ImportOpenAPIYAML(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectUUID := c.Param("project_uuid")
	if projectUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project UUID"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to open uploaded file"})
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to read uploaded file"})
		return
	}

	preview, err := h.service.PreviewOpenAPIYAML(projectUUID, data, userID.(int))
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidOpenAPIDocument):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case err.Error() == "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"preview": preview})
}

func (h *EndpointHandler) CreateEndpointsBulk(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectUUID := c.Param("project_uuid")
	if projectUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project UUID"})
		return
	}

	var req contracts.BulkCreateEndpointsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Endpoints) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No endpoints provided"})
		return
	}

	result, err := h.service.CreateEndpointsBulk(projectUUID, req.Endpoints, userID.(int))
	if err != nil {
		switch err.Error() {
		case "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": result})
}

func (h *EndpointHandler) MockHandler(c *gin.Context) {
	code := c.Param("code")
	path := c.Param("path")
	method := c.Request.Method

	project, err := h.projectService.GetByCode(code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	endpoint, err := h.service.GetByProjectIDAndPath(project.ID, path, method)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	// Set headers
	if endpoint.ResponseHeaders != "" {
		var headers map[string]string
		if err := json.Unmarshal([]byte(endpoint.ResponseHeaders), &headers); err == nil {
			for k, v := range headers {
				c.Header(k, v)
			}
		}
	}

	c.Data(endpoint.ResponseStatus, "application/json", []byte(endpoint.ResponseBody))
}
func (h *EndpointHandler) UpdateEndpoint(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	endpointUUID := c.Param("endpoint_uuid")
	if endpointUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endpoint UUID"})
		return
	}

	var req contracts.UpdateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	endpoint, err := h.service.UpdateEndpoint(endpointUUID, &req, userID.(int))
	if err != nil {
		switch err.Error() {
		case "endpoint not found", "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "endpoint with same method and path already exists":
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"endpoint": endpoint})
}

func (h *EndpointHandler) DeleteEndpoint(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	endpointUUID := c.Param("endpoint_uuid")
	if endpointUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endpoint UUID"})
		return
	}

	err := h.service.DeleteEndpoint(endpointUUID, userID.(int))
	if err != nil {
		switch err.Error() {
		case "endpoint not found", "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
	}

	c.JSON(http.StatusOK, nil)
}

func (h *EndpointHandler) GetEndpoints(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectUUID := c.Param("project_uuid")
	if projectUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project UUID"})
		return
	}

	endpoints, err := h.service.GetByProjectUUID(projectUUID, userID.(int))
	if err != nil {
		switch err.Error() {
		case "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"endpoints": endpoints})
}

func (h *EndpointHandler) GetEndpoint(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	endpointUUID := c.Param("endpoint_uuid")
	if endpointUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endpoint UUID"})
		return
	}

	endpoint, err := h.service.GetEndpoint(endpointUUID, userID.(int))
	if err != nil {
		switch err.Error() {
		case "endpoint not found", "project not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"endpoint": endpoint})
}
