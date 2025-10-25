package repository

import (
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/jmoiron/sqlx"
)

type userOrganisationMappingRepository struct {
	db *sqlx.DB
}

func NewUserOrganisationMappingRepository(db *sqlx.DB) UserOrganisationMappingRepository {
	return &userOrganisationMappingRepository{db: db}
}

func (r *userOrganisationMappingRepository) Create(mapping *models.UserOrganisationMapping) error {
	err := r.db.QueryRowx(
		"INSERT INTO user_organisation_mapping (user_id, organisation_id, created_at, updated_at, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, uuid",
		mapping.UserID, mapping.OrganisationID, mapping.CreatedAt, mapping.UpdatedAt, mapping.CreatedBy,
	).StructScan(mapping)

	if err != nil {
		return err
	}

	return nil
}

func (r *userOrganisationMappingRepository) GetByUserID(userID int) ([]*models.UserOrganisationMapping, error) {
	var mappings []*models.UserOrganisationMapping
	err := r.db.Select(
		&mappings,
		"SELECT id, uuid, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM user_organisation_mapping WHERE user_id = $1 AND deleted_at IS NULL",
		userID,
	)

	if err != nil {
		return nil, err
	}

	return mappings, nil
}

func (r *userOrganisationMappingRepository) CheckUserInOrganisation(userID, orgID int) (bool, error) {
	var count int
	err := r.db.Get(
		&count,
		"SELECT COUNT(*) FROM user_organisation_mapping WHERE user_id = $1 AND organisation_id = $2 AND deleted_at IS NULL",
		userID, orgID,
	)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
