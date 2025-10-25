package repository

import (
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/crudboxin/crudbox/internal/models"
)

type endpointRepository struct {
	db *sqlx.DB
}

func NewEndpointRepository(db *sqlx.DB) EndpointRepository {
	return &endpointRepository{db: db}
}

func (r *endpointRepository) Create(endpoint *models.Endpoint) error {
	return r.db.QueryRowx(
		"INSERT INTO endpoints (method, path, response_body, response_status, response_headers, project_id, created_at, updated_at, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id, uuid",
		endpoint.Method, endpoint.Path, endpoint.ResponseBody, endpoint.ResponseStatus, endpoint.ResponseHeaders, endpoint.ProjectID, endpoint.CreatedAt, endpoint.UpdatedAt, endpoint.CreatedBy.String,
	).StructScan(endpoint)
}

func (r *endpointRepository) GetByProjectIDAndPath(projectID int, path, method string) (*models.Endpoint, error) {
	var endpoint models.Endpoint
	err := r.db.Get(
		&endpoint,
		"SELECT id, uuid, method, path, response_body, response_status, response_headers, project_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM endpoints WHERE project_id = $1 AND path = $2 AND method = $3 AND deleted_at IS NULL",
		projectID, path, method,
	)

	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

func (r *endpointRepository) GetByID(id int) (*models.Endpoint, error) {
	var endpoint models.Endpoint
	err := r.db.Get(
		&endpoint,
		"SELECT id, uuid, method, path, response_body, response_status, response_headers, project_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM endpoints WHERE id = $1 AND deleted_at IS NULL",
		id,
	)

	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

func (r *endpointRepository) Update(endpoint *models.Endpoint) error {
	_, err := r.db.Exec(
		"UPDATE endpoints SET method = $1, path = $2, response_body = $3, response_status = $4, response_headers = $5, updated_by = $6, updated_at = $7, deleted_by = $8, deleted_at = $9 WHERE id = $10",
		endpoint.Method, endpoint.Path, endpoint.ResponseBody, endpoint.ResponseStatus, endpoint.ResponseHeaders, endpoint.UpdatedBy.String, endpoint.UpdatedAt, endpoint.DeletedBy.String, endpoint.DeletedAt, endpoint.ID,
	)
	return err
}

func (r *endpointRepository) GetByProjectID(projectID int) ([]*models.Endpoint, error) {
	var endpoints []*models.Endpoint
	err := r.db.Select(
		&endpoints,
		"SELECT id, uuid, method, path, response_body, response_status, response_headers, project_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM endpoints WHERE project_id = $1 AND deleted_at IS NULL",
		projectID,
	)

	if err != nil {
		return nil, err
	}

	return endpoints, nil
}

func (r *endpointRepository) GetByUUID(uuid string) (*models.Endpoint, error) {
	var endpoint models.Endpoint
	err := r.db.Get(
		&endpoint,
		"SELECT id, uuid, method, path, response_body, response_status, response_headers, project_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM endpoints WHERE uuid = $1 AND deleted_at IS NULL",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

func (r *endpointRepository) GetByUUIDForUser(uuid string, userID int) (*models.Endpoint, error) {
	var endpoint models.Endpoint
	err := r.db.Get(
		&endpoint,
		`SELECT e.id, e.uuid, e.method, e.path, e.response_body, e.response_status, e.response_headers, e.project_id, e.created_at, e.updated_at, e.created_by, e.updated_by, e.deleted_at, e.deleted_by
         FROM endpoints e
         JOIN projects p ON e.project_id = p.id
         WHERE e.uuid = $1 AND p.user_id = $2 AND e.deleted_at IS NULL AND p.deleted_at IS NULL`,
		uuid, userID,
	)

	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

func (r *endpointRepository) DeleteByProjectID(projectID int, userID int) error {
	now := time.Now()
	_, err := r.db.Exec(
		"UPDATE endpoints SET deleted_at = $1, deleted_by = $2, updated_by = $2, updated_at = $1 WHERE project_id = $3",
		now, userID, projectID,
	)
	return err
}
