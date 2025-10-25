package service

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/crudboxin/crudbox/internal/repository"
)

type userService struct {
	repo        repository.UserRepository
	orgRepo     repository.OrganisationRepository
	userOrgRepo repository.UserOrganisationMappingRepository
	jwtSecret   []byte
}

func NewUserService(repo repository.UserRepository, orgRepo repository.OrganisationRepository, userOrgRepo repository.UserOrganisationMappingRepository, jwtSecret []byte) UserService {
	return &userService{
		repo:        repo,
		orgRepo:     orgRepo,
		userOrgRepo: userOrgRepo,
		jwtSecret:   jwtSecret,
	}
}

func (s *userService) SignUp(req *contracts.SignUpRequest) error {
	// Check if user exists
	existingUser, err := s.repo.GetByEmail(req.Email)
	if err == nil && existingUser != nil {
		return errors.New("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	now := time.Now()
	user := &models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: "system", Valid: true}, // Will be updated after insertion
			UpdatedBy: sql.NullString{String: "system", Valid: true},
		},
	}

	return s.repo.Create(user)
}

func (s *userService) Login(req *contracts.LoginRequest) (string, error) {
	user, err := s.repo.GetByEmail(req.Email)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   user.ID,
		"user_uuid": user.UUID,
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString(s.jwtSecret)
}

func (s *userService) GetByID(id int) (*contracts.User, error) {
	dbUser, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	mappings, err := s.userOrgRepo.GetByUserID(id)
	if err != nil {
		return nil, err
	}

	var organisations []*contracts.Organisation
	for _, mapping := range mappings {
		org, err := s.orgRepo.GetByID(mapping.OrganisationID)
		if err != nil {
			return nil, err
		}
		owner, err := s.repo.GetByID(org.UserID)
		if err != nil {
			return nil, err
		}
		organisations = append(organisations, &contracts.Organisation{
			ID:        org.ID,
			UUID:      org.UUID,
			Name:      org.Name,
			UserUUID:  owner.UUID,
			CreatedAt: org.CreatedAt,
			UpdatedAt: org.UpdatedAt,
		})
	}

	return &contracts.User{
		ID:            dbUser.ID,
		UUID:          dbUser.UUID,
		Email:         dbUser.Email,
		Organisations: organisations,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}, nil
}
