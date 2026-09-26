# ER Diagram — Mini CRM

## Overview

PostgreSQL schema for the Mini CRM Telegram Mini App. Money fields use `NUMERIC(15,2)`.

**Authentication:** users can sign in via **Telegram** (`telegram_id`) or **email + password** (`email`, `password_hash`). A single account may have both identifiers linked. Telegram-only users may have an empty `email`; form-login users require a unique non-empty `email`.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ project_workers : assigned
    users ||--o{ reports_worker : submits
    users ||--o{ reports_supervisor : submits
    users ||--o{ notifications : receives
    users ||--o{ activity_logs : performs
    users ||--o{ documents : owns

    clients ||--o{ projects : has
    clients ||--o{ estimates : has

    estimates ||--o{ estimate_blocks : contains
    estimates ||--o| projects : converts_to

    estimate_templates ||--o{ estimate_template_blocks : contains

    projects ||--o{ project_workers : has
    projects ||--o{ reports_worker : has
    projects ||--o{ reports_supervisor : has
    projects ||--o{ tool_assignments : has

    reports_worker ||--o{ report_expenses : has

    tools ||--o{ tool_assignments : assigned
    tools ||--o{ tool_calibrations : calibrated

    documents }o--o| report_expenses : receipt
    documents }o--o| reports_supervisor : voice

    users {
        uuid id PK
        bigint telegram_id UK "optional, Telegram auth"
        varchar email UK "partial unique when non-empty"
        varchar password_hash "bcrypt, form auth"
        user_role role
        user_status status
        varchar first_name
        varchar last_name
        varchar phone
        numeric hourly_rate
    }

    clients {
        uuid id PK
        varchar name
        varchar country
        varchar city
        varchar contact_person
    }

    estimates {
        uuid id PK
        uuid client_id FK
        estimate_status status
        numeric total_amount
    }

    estimate_blocks {
        uuid id PK
        uuid estimate_id FK
        estimate_block_type block_type
        int sort_order
        numeric amount
    }

    projects {
        uuid id PK
        uuid client_id FK
        uuid estimate_id FK
        project_status status
        project_type type
        site_status site_status
        numeric budget
        numeric spent
    }

    project_workers {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        project_worker_role role
        confirmation_status confirmation_status
    }

    reports_worker {
        uuid id PK
        uuid project_id FK
        uuid worker_id FK
        worker_report_status status
        numeric total_hours
        numeric total_amount
    }

    reports_supervisor {
        uuid id PK
        uuid project_id FK
        uuid supervisor_id FK
        supervisor_report_status status
        site_status site_status
    }

    tools {
        uuid id PK
        tool_status status
        tool_control_type control_type
        timestamptz calibration_due_at
    }

    documents {
        uuid id PK
        varchar entity_type
        uuid entity_id
        varchar storage_path
    }

    notifications {
        uuid id PK
        uuid user_id FK
        timestamptz read_at
    }

    activity_logs {
        uuid id PK
        uuid actor_id FK
        jsonb metadata
    }
```

## Tables (17)

| Table | Description |
|-------|-------------|
| `users` | Managers, workers, supervisors (Telegram and/or email credentials) |
| `clients` | Customer companies |
| `estimates` | Cost estimates |
| `estimate_blocks` | Service/resource/expense lines |
| `estimate_templates` | Reusable estimate templates |
| `estimate_template_blocks` | Template line items |
| `projects` | Active work sites |
| `project_workers` | Worker/supervisor assignments |
| `reports_worker` | Weekly worker reports |
| `report_expenses` | Expenses in worker reports |
| `reports_supervisor` | Daily supervisor reports |
| `tools` | Equipment inventory |
| `tool_assignments` | Tool checkout per project |
| `tool_calibrations` | Calibration history |
| `documents` | Uploaded files (polymorphic) |
| `notifications` | In-app + Telegram notifications |
| `activity_logs` | Audit / activity feed |

## Migration files

| File | Content |
|------|---------|
| `000001_users_clients` | users, clients |
| `000002_estimates` | estimates, blocks, templates |
| `000003_projects` | projects, project_workers |
| `000004_reports` | worker/supervisor reports, expenses |
| `000005_tools` | tools, assignments, calibrations |
| `000006_documents_notifications` | documents, notifications, activity_logs |
| `000007_auth_credentials` | `password_hash`, unique email index for form login |

## Auth fields (`users`)

| Column | Type | Notes |
|--------|------|-------|
| `telegram_id` | `BIGINT` UNIQUE | Optional; set on Telegram Mini App login |
| `email` | `VARCHAR(255)` | Unique when non-empty; used for form login |
| `password_hash` | `VARCHAR(255)` | bcrypt hash; empty for Telegram-only accounts |
