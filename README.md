# CampusFix

CampusFix is a full-stack campus issue reporting and management application. Students can report facility problems and track their resolution; administrators can review and prioritize reports, update their status, and share progress with students. Both dashboards and the reports they display are backed by MySQL.

## Technology

- Java 21 and Spring Boot 3.5
- Spring Web, Spring Security, Spring Data JPA, Hibernate, Bean Validation
- MySQL 8 and MySQL Connector/J
- Server-served HTML, CSS, vanilla JavaScript, Bootstrap 5, and Bootstrap Icons
- Maven, JUnit 5, Mockito, and Docker Compose

## What you can do

- Create an account and sign in; passwords are stored using BCrypt.
- Submit an issue with its location, category, priority, and description.
- View your own issues, search and filter them, and see status history.
- View campus totals, active reports, priority counts, and recent activity as an administrator.
- Search and filter all reports; update status, priority, and student-facing resolution remarks.
- Keep an auditable status history for every status change.

## Prerequisites

- Java 21 or newer.
- Maven 3.9 or newer (or use the included Maven Wrapper).
- MySQL 8 running locally.
- Alternatively, Docker Desktop with the Docker Compose plugin.

## Start with Docker

From the project directory:

```powershell
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). Docker Compose starts a MySQL 8.4 database, waits for it to be ready, and then starts the application. Data is persisted in the `campusfix-mysql` volume. The database is exposed on host port `3307` so it does not conflict with a locally installed MySQL service on port `3306`.

## Start against local MySQL

1. Start MySQL and create the application database and user. For example, connect to MySQL as an administrator and run:

   ```sql
   CREATE DATABASE campusfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'campusfix'@'localhost' IDENTIFIED BY 'campusfix';
   GRANT ALL PRIVILEGES ON campusfix.* TO 'campusfix'@'localhost';
   ```

2. Set connection values as environment variables in PowerShell:

   ```powershell
   $env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/campusfix?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:SPRING_DATASOURCE_USERNAME = "campusfix"
   $env:SPRING_DATASOURCE_PASSWORD = "campusfix"
   ```

   Substitute your MySQL account's password for the example value.

3. Run the application:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   If Maven is installed instead, run `mvn spring-boot:run`.

4. Visit [http://localhost:8080](http://localhost:8080). Hibernate creates or updates the relational schema automatically.

The local defaults target MySQL on `localhost:3306`, use the `root` account, and have an empty password. Configure your own database account using the environment variables above. `.env.example` lists the supported variables. To disable demo data, set `APP_SEED_ENABLED=false`. The server port defaults to 8080 and can be overridden with `PORT`.

## Demo accounts

Demo accounts and sample complaints are created automatically when the application starts and sample data is enabled.

| Role | Email | Password |
|---|---|---|
| Student | `student@campusfix.edu` | `Student@123` |
| Administrator | `admin@campusfix.edu` | `Admin@123` |

Change these example credentials and your database configuration before deploying this demo anywhere other than a trusted local environment.

## API

All API request and response bodies use JSON. Session-cookie authentication is established by `POST /api/auth/login`; same-origin browser requests use the session automatically. Authentication failures return `401`, authorization failures return `403`, invalid input returns `400`, missing complaints return `404`, duplicate registrations return `409`, and successful creation returns `201`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a student with `{ "name", "email", "password" }`. |
| `POST` | `/api/auth/login` | Public | Sign in with `{ "email", "password" }`; sets a session cookie. |
| `GET` | `/api/auth/me` | Signed in | Return the current user. |
| `POST` | `/api/auth/logout` | Signed in | Invalidate the current session. |
| `POST` | `/api/complaints` | Student | Create a complaint; returns its unique `CF-000001`-style ID. |
| `GET` | `/api/complaints` | Signed in | Return the caller's complaints; administrators see all complaints. Accepts optional `status`, `category`, and `priority` enum filters. |
| `GET` | `/api/complaints/{id}` | Signed in | Return a complaint and status history. Students can access only their own complaints. |
| `PATCH` | `/api/admin/complaints/{id}/status` | Administrator | Change a complaint status and add an optional `{ "status", "remarks" }` update. Every change is recorded in status history. |
| `PATCH` | `/api/admin/complaints/{id}/priority` | Administrator | Set priority with `{ "priority" }`. |
| `GET` | `/api/admin/stats` | Administrator | Return campus complaint totals and recent-activity statistics. |

Status values are `PENDING`, `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, and `REJECTED`; priorities are `LOW`, `MEDIUM`, and `HIGH`; categories are `ELECTRICAL`, `WIFI`, `CLASSROOM`, `HOSTEL`, `PLUMBING`, `CLEANING`, and `OTHER`.

For example, after signing in, use a cookie-aware HTTP client:

```powershell
curl.exe -c campusfix-cookies.txt -H "Content-Type: application/json" -d '{"email":"student@campusfix.edu","password":"Student@123"}' http://localhost:8080/api/auth/login
curl.exe -b campusfix-cookies.txt -H "Content-Type: application/json" -d '{"title":"Broken classroom light","description":"The front row is dark.","location":"Science building, room 204","category":"ELECTRICAL","priority":"MEDIUM"}' http://localhost:8080/api/complaints
```

## Database

The JPA entities map to three relational tables:

- `users`: students and administrators, with unique email addresses.
- `complaints`: report details and a required foreign key to the reporting student.
- `status_history`: chronological status and progress records, with foreign keys to both the complaint and the user making the update.

`ddl-auto=update` is convenient for this academic demo. For an established production database, replace automatic schema updates with versioned database migrations and keep database credentials out of source control.

## Tests

```powershell
.\mvnw.cmd test
```

The tests cover password hashing and registration, duplicate-email handling, case-insensitive sign-in, and complaint status transitions.
