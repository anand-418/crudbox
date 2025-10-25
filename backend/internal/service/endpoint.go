package service

import (
	"database/sql"
	"errors"
	"time"

	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/models"
	"github.com/crudboxin/crudbox/internal/repository"
)

type endpointService struct {
	repo        repository.EndpointRepository
	projectRepo repository.ProjectRepository
	userRepo    repository.UserRepository
}

func NewEndpointService(repo repository.EndpointRepository, projectRepo repository.ProjectRepository, userRepo repository.UserRepository) EndpointService {
	return &endpointService{
		repo:        repo,
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

func (s *endpointService) CreateEndpoint(req *contracts.CreateEndpointRequest, projectUUID string, userID int) (*contracts.Endpoint, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	// Check for duplicate endpoint with same method and path
	existingEndpoint, err := s.repo.GetByProjectIDAndPath(project.ID, req.Path, req.Method)
	if err == nil && existingEndpoint != nil {
		return nil, errors.New("endpoint with same method and path already exists")
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	endpoint := &models.Endpoint{
		Method:          req.Method,
		Path:            req.Path,
		ResponseBody:    req.ResponseBody,
		ResponseStatus:  req.ResponseStatus,
		ResponseHeaders: req.ResponseHeaders,
		ProjectID:       project.ID,
		Base: models.Base{
			CreatedAt: &now,
			UpdatedAt: &now,
			CreatedBy: sql.NullString{String: user.UUID, Valid: true},
			UpdatedBy: sql.NullString{String: user.UUID, Valid: true},
		},
	}

	err = s.repo.Create(endpoint)
	if err != nil {
		return nil, err
	}

	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedAt:       endpoint.CreatedAt,
		UpdatedAt:       endpoint.UpdatedAt,
		CreatedBy:       user.UUID,
		UpdatedBy:       user.UUID,
	}, nil
}

func (s *endpointService) GetByProjectIDAndPath(projectID int, path, method string) (*contracts.Endpoint, error) {
	endpoint, err := s.repo.GetByProjectIDAndPath(projectID, path, method)
	if err != nil {
		return nil, err
	}
	project, err := s.projectRepo.GetByID(projectID)
	if err != nil {
		return nil, err
	}
	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedBy:       endpoint.CreatedBy.String,
		UpdatedBy:       endpoint.UpdatedBy.String,
	}, nil
}

func (s *endpointService) UpdateEndpoint(endpointUUID string, req *contracts.UpdateEndpointRequest, userID int) (*contracts.Endpoint, error) {
	endpoint, err := s.repo.GetByUUIDForUser(endpointUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("endpoint not found")
		}
		return nil, err
	}

	project, err := s.projectRepo.GetByID(endpoint.ProjectID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	// Check for potential duplicate if method or path is being updated
	newMethod := endpoint.Method
	newPath := endpoint.Path

	if req.Method != nil {
		newMethod = *req.Method
	}
	if req.Path != nil {
		newPath = *req.Path
	}

	// Only check for duplicates if method or path is actually changing
	if (req.Method != nil && *req.Method != endpoint.Method) || (req.Path != nil && *req.Path != endpoint.Path) {
		existingEndpoint, err := s.repo.GetByProjectIDAndPath(endpoint.ProjectID, newPath, newMethod)
		if err == nil && existingEndpoint != nil && existingEndpoint.ID != endpoint.ID {
			return nil, errors.New("endpoint with same method and path already exists")
		}
	}

	if req.Method != nil {
		endpoint.Method = *req.Method
	}
	if req.Path != nil {
		endpoint.Path = *req.Path
	}
	if req.ResponseBody != nil {
		endpoint.ResponseBody = *req.ResponseBody
	}
	if req.ResponseStatus != nil {
		endpoint.ResponseStatus = *req.ResponseStatus
	}
	if req.ResponseHeaders != nil {
		endpoint.ResponseHeaders = *req.ResponseHeaders
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	endpoint.UpdatedBy = sql.NullString{String: user.UUID, Valid: true}
	endpoint.UpdatedAt = &now

	err = s.repo.Update(endpoint)
	if err != nil {
		return nil, err
	}

	return &contracts.Endpoint{
		ID:              endpoint.ID,
		UUID:            endpoint.UUID,
		Method:          endpoint.Method,
		Path:            endpoint.Path,
		ResponseBody:    endpoint.ResponseBody,
		ResponseStatus:  endpoint.ResponseStatus,
		ResponseHeaders: endpoint.ResponseHeaders,
		ProjectUUID:     project.UUID,
		CreatedAt:       endpoint.CreatedAt,
		UpdatedAt:       endpoint.UpdatedAt,
		CreatedBy:       endpoint.CreatedBy.String,
		UpdatedBy:       endpoint.UpdatedBy.String,
	}, nil
}

func (s *endpointService) DeleteEndpoint(endpointUUID string, userID int) error {
	endpoint, err := s.repo.GetByUUIDForUser(endpointUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("endpoint not found")
		}
		return err
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}
	currentTime := time.Now()
	endpoint.DeletedAt = &currentTime
	endpoint.DeletedBy = sql.NullString{String: user.UUID, Valid: true}

	err = s.repo.Update(endpoint)
	if err != nil {
		return err
	}

	return nil
}

func (s *endpointService) GetByProjectUUID(projectUUID string, userID int) ([]*contracts.Endpoint, error) {
	project, err := s.projectRepo.GetByUUIDForUser(projectUUID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	endpoints, err := s.repo.GetByProjectID(project.ID)
	if err != nil {
		return nil, err
	}

	var result []*contracts.Endpoint
	for _, endpoint := range endpoints {
		result = append(result, &contracts.Endpoint{
			ID:              endpoint.ID,
			UUID:            endpoint.UUID,
			Method:          endpoint.Method,
			Path:            endpoint.Path,
			ResponseBody:    endpoint.ResponseBody,
			ResponseStatus:  endpoint.ResponseStatus,
			ResponseHeaders: endpoint.ResponseHeaders,
			ProjectUUID:     project.UUID,
			CreatedAt:       endpoint.CreatedAt,
			UpdatedAt:       endpoint.UpdatedAt,
			CreatedBy:       endpoint.CreatedBy.String,
			UpdatedBy:       endpoint.UpdatedBy.String,
		})
	}

	return result, nil
}
