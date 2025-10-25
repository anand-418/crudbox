package repository

import (
	"github.com/jmoiron/sqlx"

	"github.com/crudboxin/crudbox/internal/models"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id int) (*models.User, error)
	GetByUUID(uuid string) (*models.User, error)
}

type OrganisationRepository interface {
	Create(org *models.Organisation) error
	GetByID(id int) (*models.Organisation, error)
	GetByUUID(uuid string) (*models.Organisation, error)
}

type ProjectRepository interface {
	GetByOrganisationID(organisationID int) ([]*models.Project, error)
	Create(project *models.Project) error
	GetByID(id int) (*models.Project, error)
	GetByCode(code string) (*models.Project, error)
	GetByUUID(uuid string) (*models.Project, error)
	GetByUUIDForUser(uuid string, userID int) (*models.Project, error)
	DeleteByUUID(uuid string, userID int) error
}

type EndpointRepository interface {
	GetByProjectID(projectID int) ([]*models.Endpoint, error)
	Create(endpoint *models.Endpoint) error
	Update(endpoint *models.Endpoint) error
	GetByID(id int) (*models.Endpoint, error)
	GetByProjectIDAndPath(projectID int, path, method string) (*models.Endpoint, error)
	GetByUUID(uuid string) (*models.Endpoint, error)
	GetByUUIDForUser(uuid string, userID int) (*models.Endpoint, error)
	DeleteByProjectID(projectID int, userID int) error
}

type UserOrganisationMappingRepository interface {
	Create(mapping *models.UserOrganisationMapping) error
	GetByUserID(userID int) ([]*models.UserOrganisationMapping, error)
	CheckUserInOrganisation(userID, orgID int) (bool, error)
}

type Repositories struct {
	User           UserRepository
	Organisation   OrganisationRepository
	Project        ProjectRepository
	Endpoint       EndpointRepository
	UserOrgMapping UserOrganisationMappingRepository
}

func NewRepositories(db *sqlx.DB) *Repositories {
	return &Repositories{
		User:           NewUserRepository(db),
		Organisation:   NewOrganisationRepository(db),
		Project:        NewProjectRepository(db),
		Endpoint:       NewEndpointRepository(db),
		UserOrgMapping: NewUserOrganisationMappingRepository(db),
	}
}
