package contracts

import (
	"time"
)

type Endpoint struct {
	ID              int        `json:"-"`
	UUID            string     `json:"uuid"`
	Method          string     `json:"method"`
	Path            string     `json:"path"`
	ResponseBody    string     `json:"response_body"`
	ResponseStatus  int        `json:"response_status"`
	ResponseHeaders string     `json:"response_headers"`
	ProjectUUID     string     `json:"project_uuid"`
	CreatedAt       *time.Time `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
	CreatedBy       string     `json:"created_by,omitempty"`
	UpdatedBy       string     `json:"updated_by,omitempty"`
}

type CreateEndpointRequest struct {
	Method          string `json:"method" binding:"required"`
	Path            string `json:"path" binding:"required"`
	ResponseBody    string `json:"response_body"`
	ResponseStatus  int    `json:"response_status"`
	ResponseHeaders string `json:"response_headers"`
}

type UpdateEndpointRequest struct {
	Method          *string `json:"method"`
	Path            *string `json:"path"`
	ResponseBody    *string `json:"response_body"`
	ResponseStatus  *int    `json:"response_status"`
	ResponseHeaders *string `json:"response_headers"`
}
