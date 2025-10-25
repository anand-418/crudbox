package repository

import (
	"github.com/jmoiron/sqlx"

	"github.com/crudboxin/crudbox/internal/models"
)

type organisationRepository struct {
	db *sqlx.DB
}

func NewOrganisationRepository(db *sqlx.DB) OrganisationRepository {
	return &organisationRepository{db: db}
}

func (r *organisationRepository) Create(org *models.Organisation) error {
	return r.db.QueryRowx(
		"INSERT INTO organisations (name, user_id, created_at, updated_at, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, uuid",
		org.Name, org.UserID, org.CreatedAt, org.UpdatedAt, org.CreatedBy.String,
	).StructScan(org)
}

func (r *organisationRepository) GetByID(id int) (*models.Organisation, error) {
	var org models.Organisation
	err := r.db.Get(
		&org,
		"SELECT id, uuid, name, user_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM organisations WHERE id = $1 AND deleted_at IS NULL",
		id,
	)

	if err != nil {
		return nil, err
	}

	return &org, nil
}

func (r *organisationRepository) GetByUUID(uuid string) (*models.Organisation, error) {
	var org models.Organisation
	err := r.db.Get(
		&org,
		"SELECT id, uuid, name, user_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM organisations WHERE uuid = $1 AND deleted_at IS NULL",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	return &org, nil
}
