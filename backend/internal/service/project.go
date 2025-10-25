package service

import (
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/crudboxin/crudbox/internal/repository"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

type projectService struct {
	repo         repository.ProjectRepository
	userRepo     repository.UserRepository
	orgRepo      repository.OrganisationRepository
	endpointRepo repository.EndpointRepository
	userOrgRepo  repository.UserOrganisationMappingRepository
}

func NewProjectService(repo repository.ProjectRepository, userRepo repository.UserRepository, orgRepo repository.OrganisationRepository, userOrgRepo repository.UserOrganisationMappingRepository, endpointRepo repository.EndpointRepository) ProjectService {
	return &projectService{
		repo:         repo,
		userRepo:     userRepo,
		orgRepo:      orgRepo,
		userOrgRepo:  userOrgRepo,
		endpointRepo: endpointRepo,
	}
}

func (s *projectService) generateUniqueCode(repo repository.ProjectRepository) string {
	for {
		code := make([]byte, 5)
		rand.Read(code)
		for i := range code {
			code[i] = charset[code[i]%byte(len(charset))]
		}
		codeStr := string(code)

		// Check if code exists
		_, err := repo.GetByCode(codeStr)
		if err != nil {
			return codeStr
		}
	}
}

func (s *projectService) CreateProject(req *contracts.CreateProjectRequest, userID int) (*contracts.Project, error) {
	org, err := s.orgRepo.GetByUUID(req.OrganisationUUID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("organisation not found")
		}
		return nil, err
	}

	belongs, err := s.userOrgRepo.CheckUserInOrganisation(userID, org.ID)
	if err != nil {
		return nil, err
	}
	if !belongs {
		return nil, errors.New("user does not belong to the specified organisation")
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	dbProject := &models.Project{
		Name:           req.Name,
		Code:           s.generateUniqueCode(s.repo),
		UserID:         userID,
		OrganisationID: org.ID,
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: user.UUID, Valid: true},
			UpdatedBy: sql.NullString{String: user.UUID, Valid: true},
		},
	}

	err = s.repo.Create(dbProject)
	if err != nil {
		return nil, err
	}

	return &contracts.Project{
		ID:               dbProject.ID,
		UUID:             dbProject.UUID,
		Name:             dbProject.Name,
		Code:             dbProject.Code,
		UserUUID:         user.UUID,
		OrganisationUUID: org.UUID,
		CreatedAt:        dbProject.CreatedAt,
		UpdatedAt:        dbProject.UpdatedAt,
	}, nil
}

func (s *projectService) GetByCode(code string) (*contracts.Project, error) {
	dbProject, err := s.repo.GetByCode(code)
	if err != nil {
		return nil, err
	}

	org, err := s.orgRepo.GetByID(dbProject.OrganisationID)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(dbProject.UserID)
	if err != nil {
		return nil, err
	}

	return &contracts.Project{
		ID:               dbProject.ID,
		UUID:             dbProject.UUID,
		Name:             dbProject.Name,
		Code:             dbProject.Code,
		UserUUID:         user.UUID,
		OrganisationUUID: org.UUID,
		CreatedAt:        dbProject.CreatedAt,
		UpdatedAt:        dbProject.UpdatedAt,
	}, nil
}

func (s *projectService) GetByUUID(uuid string) (*contracts.Project, error) {
	dbProject, err := s.repo.GetByUUID(uuid)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	org, err := s.orgRepo.GetByID(dbProject.OrganisationID)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(dbProject.UserID)
	if err != nil {
		return nil, err
	}

	return &contracts.Project{
		ID:               dbProject.ID,
		UUID:             dbProject.UUID,
		Name:             dbProject.Name,
		Code:             dbProject.Code,
		UserUUID:         user.UUID,
		OrganisationUUID: org.UUID,
		CreatedAt:        dbProject.CreatedAt,
		UpdatedAt:        dbProject.UpdatedAt,
	}, nil
}

func (s *projectService) GetByUserID(userID int) ([]*contracts.Project, error) {
	mappings, err := s.userOrgRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	var projects []*contracts.Project
	for _, mapping := range mappings {
		orgProjects, err := s.repo.GetByOrganisationID(mapping.OrganisationID)
		if err != nil {
			return nil, err
		}
		for _, proj := range orgProjects {
			org, err := s.orgRepo.GetByID(proj.OrganisationID)
			if err != nil {
				return nil, err
			}
			owner, err := s.userRepo.GetByID(proj.UserID)
			if err != nil {
				return nil, err
			}
			projects = append(projects, &contracts.Project{
				ID:               proj.ID,
				UUID:             proj.UUID,
				Name:             proj.Name,
				Code:             proj.Code,
				UserUUID:         owner.UUID,
				OrganisationUUID: org.UUID,
				CreatedAt:        proj.CreatedAt,
				UpdatedAt:        proj.UpdatedAt,
			})
		}
	}

	return projects, nil
}

func (s *projectService) DeleteProject(projectUUID string, userID int) error {
	project, err := s.repo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("no project found")
		}
		return err
	}

	err = s.endpointRepo.DeleteByProjectID(project.ID, userID)
	if err != nil {
		return err
	}

	err = s.repo.DeleteByUUID(projectUUID, userID)
	if err != nil {
		return err
	}

	return nil
}
