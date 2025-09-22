
-- GSHOP Database Initialization Script
-- This script will be executed when PostgreSQL container starts

-- Create database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable in docker-compose)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Full Text Search extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create indexes for better performance (will be created after tables are created by TypeORM)
-- These commands will be run after migrations

-- Note: The actual table creation is handled by TypeORM migrations
-- This script only sets up extensions and initial configuration
