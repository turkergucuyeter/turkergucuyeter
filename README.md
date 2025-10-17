# Restaurant Management and Ordering System

This repository contains the implementation of a multi-tenant restaurant platform that covers customer ordering, restaurant administration, kitchen operations, reservations, and analytics.

## Project Structure

- `docs/` – Functional requirements, timeline, and operational procedures.
- `backend/` – Spring Boot services, H2/PostgreSQL-ready persistence layer, REST APIs, and Swagger docs.
- `frontend/` – (Placeholder) Client-facing applications for mobile and web experiences. The backend exposes the core domain capabilities required by these applications.

## Backend Highlights

The Spring Boot backend currently delivers:

- Restaurant, table, menu, reservation, order, payment, notification, and user management endpoints under `/api/**`.
- Service layer enforcing business rules for reservations, QR menu management, live order status flows, and payment capture bookkeeping.
- H2 in-memory database configuration for local development (swap to PostgreSQL by updating `application.yml`).
- OpenAPI documentation exposed at `/swagger-ui.html`.
- Sample integration test validating the restaurant creation flow.

Refer to `docs/project_plan.md` for the full delivery roadmap, milestones, and technology stack.

## Getting Started

```bash
cd backend
mvn spring-boot:run
```

Visit `http://localhost:8080/swagger-ui.html` to explore the API once the application starts.
