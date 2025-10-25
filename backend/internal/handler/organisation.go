package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/service"
)

type OrganisationHandler struct {
	service service.OrganisationService
}

func NewOrganisationHandler(service service.OrganisationService) *OrganisationHandler {
	return &OrganisationHandler{service: service}
}

func (h *OrganisationHandler) CreateOrganisation(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req contracts.CreateOrganisationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org, err := h.service.CreateOrganisation(&req, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"organisation": org})
}

func (h *OrganisationHandler) GetOrganisations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	organisations, err := h.service.GetByUserID(userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"organisations": organisations})
}
