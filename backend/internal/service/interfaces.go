package service

import (
	"github.com/crudboxin/crudbox/internal/contracts"
	"github.com/crudboxin/crudbox/internal/repository"
)

type UserService interface {
	SignUp(req *contracts.SignUpRequest) error
	Login(req *contracts.LoginRequest) (string, error)
	GetByID(id int) (*contracts.User, error)
}

type OrganisationService interface {
	GetByUserID(userID int) ([]*contracts.Organisation, error)
	CreateOrganisation(req *contracts.CreateOrganisationRequest, userID int) (*contracts.Organisation, error)
}

type ProjectService interface {
	GetByUserID(userID int) ([]*contracts.Project, error)
	CreateProject(req *contracts.CreateProjectRequest, userID int) (*contracts.Project, error)
	GetByCode(code string) (*contracts.Project, error)
	GetByUUID(uuid string) (*contracts.Project, error)
	DeleteProject(uuid string, userID int) error
}

type EndpointService interface {
	GetByProjectUUID(projectUUID string, userID int) ([]*contracts.Endpoint, error)
	CreateEndpoint(req *contracts.CreateEndpointRequest, projectUUID string, userID int) (*contracts.Endpoint, error)
	UpdateEndpoint(endpointUUID string, req *contracts.UpdateEndpointRequest, userID int) (*contracts.Endpoint, error)
	DeleteEndpoint(endpointUUID string, userID int) error
	GetByProjectIDAndPath(projectID int, path, method string) (*contracts.Endpoint, error)
	PreviewOpenAPIYAML(projectUUID string, data []byte, userID int) (*contracts.OpenAPIImportPreview, error)
	CreateEndpointsBulk(projectUUID string, requests []contracts.CreateEndpointRequest, userID int) (*contracts.BulkCreateEndpointsResult, error)
	GetEndpoint(endpointUUID string, userID int) (*contracts.Endpoint, error)
}

type Services struct {
	User         UserService
	Organisation OrganisationService
	Project      ProjectService
	Endpoint     EndpointService
}

func NewServices(repos *repository.Repositories, jwtSecret []byte) *Services {
	return &Services{
		User:         NewUserService(repos.User, repos.Organisation, repos.UserOrgMapping, jwtSecret),
		Organisation: NewOrganisationService(repos.Organisation, repos.User, repos.UserOrgMapping),
		Project:      NewProjectService(repos.Project, repos.User, repos.Organisation, repos.UserOrgMapping, repos.Endpoint),
		Endpoint:     NewEndpointService(repos.Endpoint, repos.Project, repos.User),
	}
}
