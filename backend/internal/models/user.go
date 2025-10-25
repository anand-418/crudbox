package models

type User struct {
	UUID     string `db:"uuid"`
	ID       int    `db:"id"`
	Email    string `db:"email"`
	Password string `db:"password"`
	Base
}
