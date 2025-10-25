package models

import (
	"database/sql"
	"time"
)

type Base struct {
	CreatedAt *time.Time     `db:"created_at"`
	UpdatedAt *time.Time     `db:"updated_at"`
	CreatedBy sql.NullString `db:"created_by"`
	UpdatedBy sql.NullString `db:"updated_by"`
	DeletedAt *time.Time     `db:"deleted_at"`
	DeletedBy sql.NullString `db:"deleted_by"`
}
