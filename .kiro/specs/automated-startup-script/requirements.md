# Requirements Document

## Introduction

This document specifies the requirements for an automated startup script system for the Nexus Global Web3 project. The system will provide a PowerShell script that automates the initialization of the development environment, including database migration from PostgreSQL to sql.js, environment configuration, prerequisite verification, and automatic startup of backend and frontend services in separate terminal windows.

## Glossary

- **Startup_Script**: The PowerShell script (START-NOW.ps1) that orchestrates the automated initialization
- **Backend_Service**: The Express API server running in artifacts/api-server
- **Frontend_Service**: The React + Vite application running in artifacts/nexus
- **Database_Layer**: The database abstraction layer in lib/db/src/index.ts
- **Drizzle_Config**: The Drizzle ORM configuration file in lib/db/drizzle.config.ts
- **Environment_Variables**: Configuration values required for service operation (PORT, BASE_PATH, DATABASE_URL, API keys)
- **Prerequisites**: Required software and dependencies (Node.js, pnpm, installed packages)
- **sql.js**: SQLite compiled to JavaScript, providing a database without native compilation
- **WASM_File**: The sql-wasm.wasm file required by sql.js for operation
- **Native_Module**: A Node.js module requiring platform-specific compilation (e.g., better-sqlite3, lightningcss)
- **Artifact_Config**: The .replit-artifact/artifact.toml configuration files for each service
- **Build_Output**: The compiled JavaScript files in artifacts/api-server/dist/

## Requirements

### Requirement 1: PowerShell Startup Script

**User Story:** As a developer, I want a single PowerShell script to start the entire development environment, so that I can begin working without manual configuration steps.

#### Acceptance Criteria

1. THE Startup_Script SHALL be named START-NOW.ps1 and located in the project root directory
2. WHEN the Startup_Script is executed, THE Startup_Script SHALL verify all Prerequisites before starting services
3. WHEN the Startup_Script is executed, THE Startup_Script SHALL configure all Environment_Variables before starting services
4. WHEN the Startup_Script is executed, THE Startup_Script SHALL start the Backend_Service in a separate PowerShell window
5. WHEN the Startup_Script is executed, THE Startup_Script SHALL start the Frontend_Service in a separate PowerShell window
6. WHEN the Startup_Script is executed, THE Startup_Script SHALL display status messages indicating progress and completion
7. IF any Prerequisite verification fails, THEN THE Startup_Script SHALL display a descriptive error message and exit with a non-zero status code
8. THE Startup_Script SHALL preserve the original PowerShell window for displaying status messages and logs

### Requirement 2: Prerequisite Verification

**User Story:** As a developer, I want the startup script to verify all prerequisites, so that I receive clear error messages if something is missing.

#### Acceptance Criteria

1. THE Startup_Script SHALL verify that Node.js is installed and accessible in the system PATH
2. THE Startup_Script SHALL verify that pnpm is installed and accessible in the system PATH
3. THE Startup_Script SHALL verify that node_modules directories exist in the project root
4. WHEN Node.js is not found, THE Startup_Script SHALL display an error message with installation instructions
5. WHEN pnpm is not found, THE Startup_Script SHALL display an error message with installation instructions
6. WHEN node_modules is not found, THE Startup_Script SHALL display an error message instructing to run "pnpm install"
7. THE Startup_Script SHALL verify that the lightningcss Windows binary (lightningcss-win32-x64-msvc) is present in node_modules
8. IF the lightningcss binary is missing, THEN THE Startup_Script SHALL display a warning message with installation instructions

### Requirement 3: Database Migration to sql.js

**User Story:** As a developer, I want the database to use sql.js instead of PostgreSQL, so that I can run the application on Windows without native module compilation issues.

#### Acceptance Criteria

1. THE Database_Layer SHALL use sql.js instead of node-postgres for database operations
2. THE Database_Layer SHALL initialize sql.js with the WASM_File from the sql.js package
3. THE Drizzle_Config SHALL specify "sqlite" as the dialect instead of "postgresql"
4. THE Database_Layer SHALL create or open a SQLite database file at ./data/database.sqlite
5. WHEN the database file does not exist, THE Database_Layer SHALL create it automatically
6. THE Database_Layer SHALL export the same interface as the previous PostgreSQL implementation for backward compatibility
7. THE package.json in lib/db SHALL NOT include pg or node-postgres dependencies
8. THE package.json in lib/db SHALL include sql.js as a dependency

### Requirement 4: WASM File Deployment

**User Story:** As a developer, I want the sql-wasm.wasm file to be available at runtime, so that sql.js can function correctly in the built application.

#### Acceptance Criteria

1. THE build process for Backend_Service SHALL copy sql-wasm.wasm from node_modules/sql.js/dist/ to Build_Output
2. WHEN the Backend_Service is built, THE sql-wasm.wasm file SHALL be present in artifacts/api-server/dist/
3. THE Database_Layer SHALL configure sql.js to locate the WASM_File in the correct path relative to the running application
4. IF the WASM_File is not found at runtime, THEN THE Database_Layer SHALL throw a descriptive error message indicating the missing file and expected location

### Requirement 5: Port Configuration

**User Story:** As a developer, I want to use standard development ports, so that the application follows common conventions and avoids conflicts.

#### Acceptance Criteria

1. THE Backend_Service SHALL listen on port 3001 instead of port 8080
2. THE Frontend_Service SHALL listen on port 4000 instead of port 18245
3. THE Artifact_Config for Backend_Service SHALL specify localPort as 3001
4. THE Artifact_Config for Frontend_Service SHALL specify localPort as 4000
5. THE Artifact_Config for Backend_Service SHALL set PORT environment variable to "3001"
6. THE Artifact_Config for Frontend_Service SHALL set PORT environment variable to "4000"
7. THE Frontend_Service SHALL configure API requests to use port 3001 for backend communication
8. THE Startup_Script SHALL set PORT environment variables to 3001 and 4000 for Backend_Service and Frontend_Service respectively

### Requirement 6: Environment Variable Configuration

**User Story:** As a developer, I want all required environment variables to be configured automatically, so that I don't need to set them manually before each startup.

#### Acceptance Criteria

1. THE Startup_Script SHALL set NODE_ENV to "development" for both services
2. THE Startup_Script SHALL set PORT to "3001" for Backend_Service
3. THE Startup_Script SHALL set PORT to "4000" for Frontend_Service
4. THE Startup_Script SHALL set BASE_PATH to "/" for Frontend_Service
5. THE Startup_Script SHALL set DATABASE_URL to "file:./data/database.sqlite" for Backend_Service
6. THE Startup_Script SHALL set AI_INTEGRATIONS_OPENAI_API_KEY to "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"
7. THE Startup_Script SHALL set AI_INTEGRATIONS_OPENAI_BASE_URL to the appropriate Groq API endpoint
8. WHEN starting Backend_Service, THE Startup_Script SHALL pass all backend-specific Environment_Variables to the new PowerShell window
9. WHEN starting Frontend_Service, THE Startup_Script SHALL pass all frontend-specific Environment_Variables to the new PowerShell window

### Requirement 7: Service Startup Management

**User Story:** As a developer, I want each service to run in its own terminal window, so that I can monitor logs independently and stop services individually.

#### Acceptance Criteria

1. WHEN starting Backend_Service, THE Startup_Script SHALL open a new PowerShell window with a descriptive title "Nexus Backend - Port 3001"
2. WHEN starting Frontend_Service, THE Startup_Script SHALL open a new PowerShell window with a descriptive title "Nexus Frontend - Port 4000"
3. THE Startup_Script SHALL execute "pnpm --filter @workspace/api-server run dev" in the Backend_Service window
4. THE Startup_Script SHALL execute "pnpm --filter @workspace/nexus run dev" in the Frontend_Service window
5. THE Startup_Script SHALL wait 5 seconds between starting Backend_Service and Frontend_Service to allow backend initialization
6. THE new PowerShell windows SHALL remain open after the services start to display runtime logs
7. WHEN a service process terminates, THE corresponding PowerShell window SHALL remain open to display the exit status and any error messages

### Requirement 8: Native Module Handling

**User Story:** As a developer, I want clear guidance on native module issues, so that I can resolve compilation problems on Windows.

#### Acceptance Criteria

1. THE requirements documentation SHALL document that better-sqlite3 is replaced by sql.js to avoid native compilation
2. THE requirements documentation SHALL document that lightningcss requires the lightningcss-win32-x64-msvc binary package
3. THE requirements documentation SHALL provide installation commands for missing native module binaries
4. WHERE the lightningcss binary is missing, THE Startup_Script SHALL display the command "pnpm add -D lightningcss-win32-x64-msvc"
5. THE pnpm-workspace.yaml SHALL NOT exclude lightningcss-win32-x64-msvc in the overrides section
6. IF a native module compilation error occurs during startup, THEN THE Startup_Script SHALL detect it and display troubleshooting guidance

### Requirement 9: API Key Configuration

**User Story:** As a developer, I want the OpenAI integration to use the correct API key, so that AI features function properly.

#### Acceptance Criteria

1. THE Startup_Script SHALL configure AI_INTEGRATIONS_OPENAI_API_KEY with the value "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"
2. THE Backend_Service SHALL read AI_INTEGRATIONS_OPENAI_API_KEY from environment variables
3. THE lib/integrations-openai-ai-server package SHALL use the configured API key for all OpenAI API requests
4. IF AI_INTEGRATIONS_OPENAI_API_KEY is not set, THEN THE Backend_Service SHALL log a warning message indicating that AI features will not function
5. THE Startup_Script SHALL configure AI_INTEGRATIONS_OPENAI_BASE_URL to point to the Groq API endpoint (https://api.groq.com/openai/v1)

### Requirement 10: Error Handling and Logging

**User Story:** As a developer, I want clear error messages and status updates, so that I can quickly identify and resolve issues.

#### Acceptance Criteria

1. WHEN the Startup_Script encounters an error, THE Startup_Script SHALL display the error message in red text
2. WHEN the Startup_Script completes a step successfully, THE Startup_Script SHALL display a success message in green text
3. WHEN the Startup_Script is performing a step, THE Startup_Script SHALL display an informational message in yellow text
4. THE Startup_Script SHALL log the timestamp for each major operation
5. IF a service fails to start, THEN THE Startup_Script SHALL display the service name and the reason for failure
6. THE Startup_Script SHALL provide a summary at the end indicating which services started successfully
7. WHEN all services start successfully, THE Startup_Script SHALL display the URLs for accessing Backend_Service (http://localhost:3001) and Frontend_Service (http://localhost:4000)

### Requirement 11: Database Schema Migration

**User Story:** As a developer, I want the database schema to be compatible with SQLite, so that the migration from PostgreSQL to sql.js is seamless.

#### Acceptance Criteria

1. THE Database_Layer SHALL support all existing Drizzle schema definitions with SQLite
2. WHERE PostgreSQL-specific data types are used, THE schema definitions SHALL be updated to use SQLite-compatible types
3. THE Database_Layer SHALL run Drizzle migrations automatically on startup if the database schema is outdated
4. WHEN the database file is created for the first time, THE Database_Layer SHALL apply all migrations to create the initial schema
5. THE Database_Layer SHALL maintain referential integrity constraints defined in the schema
6. IF a migration fails, THEN THE Database_Layer SHALL throw a descriptive error message and prevent the Backend_Service from starting

### Requirement 12: Build Process Integration

**User Story:** As a developer, I want the build process to handle all necessary file copying, so that the application runs correctly after building.

#### Acceptance Criteria

1. THE build.mjs script for Backend_Service SHALL copy the WASM_File to Build_Output
2. THE build.mjs script SHALL preserve the directory structure required by sql.js
3. WHEN the build process completes, THE Build_Output SHALL contain all files necessary to run Backend_Service
4. THE build.mjs script SHALL log a message indicating successful WASM_File copying
5. IF the WASM_File is not found during build, THEN THE build.mjs script SHALL throw an error and halt the build process

### Requirement 13: Documentation and README

**User Story:** As a developer, I want clear documentation on how to use the startup script, so that I can quickly understand the setup process.

#### Acceptance Criteria

1. THE project root SHALL contain a README.md file documenting the startup script usage
2. THE README.md SHALL include a "Quick Start" section with the command to run the Startup_Script
3. THE README.md SHALL document all Environment_Variables and their purposes
4. THE README.md SHALL include a "Troubleshooting" section for common issues
5. THE README.md SHALL document the port numbers for Backend_Service and Frontend_Service
6. THE README.md SHALL explain the migration from PostgreSQL to sql.js and the reasons for it
7. THE README.md SHALL provide instructions for installing missing Prerequisites

