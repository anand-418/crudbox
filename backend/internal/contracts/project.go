package contracts

import (
	"time"
)

type Project struct {
	ID               int        `json:"-"`
	UUID             string     `json:"uuid"`
	Name             string     `json:"name"`
	Code             string     `json:"code"`
	UserUUID         string     `json:"user_uuid"`
	OrganisationUUID string     `json:"organisation_uuid"`
	CreatedAt        *time.Time `json:"created_at"`
	UpdatedAt        *time.Time `json:"updated_at"`
}

type CreateProjectRequest struct {
	Name             string `json:"name" binding:"required"`
	OrganisationUUID string `json:"organisation_uuid" binding:"required,uuid"`
}
