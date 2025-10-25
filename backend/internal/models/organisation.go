package models

type Organisation struct {
	UUID   string `db:"uuid"`
	ID     int    `db:"id"`
	Name   string `db:"name"`
	UserID int    `db:"user_id"`
	Base
}
