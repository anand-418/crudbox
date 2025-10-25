package database

import (
	"embed"
	"fmt"
	"sort"

	"github.com/jmoiron/sqlx"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func RunMigrations(db *sqlx.DB) error {
	if _, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by BIGINT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by BIGINT,
            deleted_at TIMESTAMPTZ,
            deleted_by BIGINT
        )
    `); err != nil {
		return fmt.Errorf("failed to ensure schema_migrations table: %w", err)
	}

	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations: %w", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		var alreadyRun bool
		if err := db.QueryRow(`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE filename = $1)`, entry.Name()).Scan(&alreadyRun); err != nil {
			return fmt.Errorf("failed to check migration status for %s: %w", entry.Name(), err)
		}

		if alreadyRun {
			continue
		}

		contents, err := migrationFiles.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", entry.Name(), err)
		}

		tx, err := db.Beginx()
		if err != nil {
			return fmt.Errorf("failed to start transaction for migration %s: %w", entry.Name(), err)
		}

		if _, err := tx.Exec(string(contents)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w", entry.Name(), err)
		}

		if _, err := tx.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1)`, entry.Name()); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", entry.Name(), err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", entry.Name(), err)
		}
	}

	return nil
}
