package models

type Endpoint struct {
	Base
	UUID            string `db:"uuid"`
	ID              int    `db:"id"`
	Method          string `db:"method"`
	Path            string `db:"path"`
	ResponseBody    string `db:"response_body"`
	ResponseStatus  int    `db:"response_status"`
	ResponseHeaders string `db:"response_headers"`
	ProjectID       int    `db:"project_id"`
}
