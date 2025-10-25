package service

import (
	"database/sql"
	"time"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/crudboxin/crudbox/internal/repository"
)

type organisationService struct {
	repo        repository.OrganisationRepository
	userRepo    repository.UserRepository
	userOrgRepo repository.UserOrganisationMappingRepository
}

func NewOrganisationService(repo repository.OrganisationRepository, userRepo repository.UserRepository, userOrgRepo repository.UserOrganisationMappingRepository) OrganisationService {
	return &organisationService{
		repo:        repo,
		userRepo:    userRepo,
		userOrgRepo: userOrgRepo,
	}
}

func (s *organisationService) CreateOrganisation(req *contracts.CreateOrganisationRequest, userID int) (*contracts.Organisation, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	dbOrg := &models.Organisation{
		Name:   req.Name,
		UserID: userID,
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: user.UUID, Valid: true},
			UpdatedBy: sql.NullString{String: user.UUID, Valid: true},
		},
	}

	err = s.repo.Create(dbOrg)
	if err != nil {
		return nil, err
	}

	// Create mapping between user and organisation
	mapping := &models.UserOrganisationMapping{
		UserID:         userID,
		OrganisationID: dbOrg.ID,
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: user.UUID, Valid: true},
			UpdatedBy: sql.NullString{String: user.UUID, Valid: true},
		},
	}
	err = s.userOrgRepo.Create(mapping)
	if err != nil {
		return nil, err
	}

	return &contracts.Organisation{
		ID:        dbOrg.ID,
		UUID:      dbOrg.UUID,
		Name:      dbOrg.Name,
		UserUUID:  user.UUID,
		CreatedAt: dbOrg.CreatedAt,
		UpdatedAt: dbOrg.UpdatedAt,
	}, nil
}

func (s *organisationService) GetByUserID(userID int) ([]*contracts.Organisation, error) {
	mappings, err := s.userOrgRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	var organisations []*contracts.Organisation
	for _, mapping := range mappings {
		org, err := s.repo.GetByID(mapping.OrganisationID)
		if err != nil {
			return nil, err
		}
		owner, err := s.userRepo.GetByID(org.UserID)
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

	return organisations, nil
}
