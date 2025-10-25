package models

type UserOrganisationMapping struct {
	UUID           string `db:"uuid"`
	ID             int    `db:"id"`
	UserID         int    `db:"user_id"`
	OrganisationID int    `db:"organisation_id"`
	Base
}
