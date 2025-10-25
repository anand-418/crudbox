CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR DEFAULT NULL,
    updated_by VARCHAR DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR DEFAULT NULL
);

CREATE TABLE organisations (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR DEFAULT NULL,
    updated_by VARCHAR DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR DEFAULT NULL
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(5) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id),
    organisation_id INT NOT NULL REFERENCES organisations(id),
    created_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR DEFAULT NULL,
    updated_by VARCHAR DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR DEFAULT NULL
);

CREATE TABLE endpoints (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    response_body TEXT,
    response_status INTEGER NOT NULL,
    response_headers TEXT,
    project_id INT NOT NULL REFERENCES projects(id),
    created_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR DEFAULT NULL,
    updated_by VARCHAR DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR DEFAULT NULL
);

CREATE TABLE user_organisation_mapping (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id INT NOT NULL,
    organisation_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR DEFAULT NULL,
    updated_by VARCHAR DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
    UNIQUE(user_id, organisation_id)
);
