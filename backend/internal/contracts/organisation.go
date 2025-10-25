package contracts

import (
	"time"
)

type Organisation struct {
	ID        int        `json:"-"`
	UUID      string     `json:"uuid"`
	Name      string     `json:"name"`
	UserUUID  string     `json:"user_uuid"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type CreateOrganisationRequest struct {
	Name string `json:"name" binding:"required"`
}
