package models

type Project struct {
	UUID           string `db:"uuid"`
	ID             int    `db:"id"`
	Name           string `db:"name"`
	Code           string `db:"code"`
	UserID         int    `db:"user_id"`
	OrganisationID int    `db:"organisation_id"`
	Base
}
