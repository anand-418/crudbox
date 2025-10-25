package repository

import (
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/crudboxin/crudbox/internal/models"
)

type projectRepository struct {
	db *sqlx.DB
}

func NewProjectRepository(db *sqlx.DB) ProjectRepository {
	return &projectRepository{db: db}
}

func (r *projectRepository) Create(project *models.Project) error {
	return r.db.QueryRowx(
		"INSERT INTO projects (name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id, uuid",
		project.Name, project.Code, project.UserID, project.OrganisationID, project.CreatedAt, project.UpdatedAt, project.CreatedBy.String,
	).StructScan(project)
}

func (r *projectRepository) GetByID(id int) (*models.Project, error) {
	var project models.Project
	err := r.db.Get(
		&project,
		"SELECT id, uuid, name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM projects WHERE id = $1 AND deleted_at IS NULL",
		id,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *projectRepository) GetByCode(code string) (*models.Project, error) {
	var project models.Project
	err := r.db.Get(
		&project,
		"SELECT id, uuid, name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM projects WHERE code = $1 AND deleted_at IS NULL",
		code,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *projectRepository) GetByOrganisationID(organisationID int) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Select(
		&projects,
		"SELECT id, uuid, name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM projects WHERE organisation_id = $1 AND deleted_at IS NULL",
		organisationID,
	)

	if err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *projectRepository) GetByUUID(uuid string) (*models.Project, error) {
	var project models.Project
	err := r.db.Get(
		&project,
		"SELECT id, uuid, name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM projects WHERE uuid = $1 AND deleted_at IS NULL",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *projectRepository) GetByUUIDForUser(uuid string, userID int) (*models.Project, error) {
	var project models.Project
	err := r.db.Get(
		&project,
		"SELECT id, uuid, name, code, user_id, organisation_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM projects WHERE uuid = $1 AND user_id = $2 AND deleted_at IS NULL",
		uuid, userID,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *projectRepository) DeleteByUUID(projectUUID string, userID int) error {
	now := time.Now()
	_, err := r.db.Exec(
		"UPDATE projects SET deleted_at = $1, deleted_by = $2, updated_by = $2, updated_at = $1 WHERE uuid = $3",
		now, userID, projectUUID,
	)
	return err
}
