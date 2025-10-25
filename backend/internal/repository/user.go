package repository

import (
	"database/sql"

	"github.com/crudboxin/crudbox/internal/models"
	"github.com/jmoiron/sqlx"
)

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	err := r.db.QueryRowx(
		"INSERT INTO users (email, password, created_at, updated_at, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, uuid",
		user.Email, user.Password, user.CreatedAt, user.UpdatedAt, user.CreatedBy,
	).StructScan(user)

	if err != nil {
		return err
	}

	user.CreatedBy = sql.NullString{String: user.UUID, Valid: true}
	user.UpdatedBy = sql.NullString{String: user.UUID, Valid: true}
	_, err = r.db.Exec("UPDATE users SET created_by = $1, updated_by = $1 WHERE id = $2", user.UUID, user.ID)
	return err
}

func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Get(
		&user,
		"SELECT id, uuid, email, password, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM users WHERE email = $1 AND deleted_at IS NULL",
		email,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetByID(id int) (*models.User, error) {
	var user models.User
	err := r.db.Get(
		&user,
		"SELECT id, uuid, email, password, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM users WHERE id = $1 AND deleted_at IS NULL",
		id,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetByUUID(uuid string) (*models.User, error) {
	var user models.User
	err := r.db.Get(
		&user,
		"SELECT id, uuid, email, password, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by FROM users WHERE uuid = $1 AND deleted_at IS NULL",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
