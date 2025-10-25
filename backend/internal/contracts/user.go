package contracts

import (
	"time"
)

type User struct {
	ID            int             `json:"-"`
	UUID          string          `json:"uuid"`
	Email         string          `json:"email"`
	Organisations []*Organisation `json:"organisations"`
	CreatedAt     *time.Time      `json:"created_at"`
	UpdatedAt     *time.Time      `json:"updated_at"`
}

type SignUpRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
