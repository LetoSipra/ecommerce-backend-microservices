# Ecommerce Backend Microservices

This repository contains a full-fledged, microservices-based e-commerce backend application. Each service is containerized with Docker and orchestrated via Docker Compose, with Nginx acting as a reverse proxy. Swagger UI is exposed on each service for API exploration and testing.

---

## Architecture Overview

![Architecture Diagram](https://i.imgur.com/4lTxgTn.png)

- **Nginx**: Reverse proxy routing incoming HTTP requests to the appropriate service.
- **Services**:

  | Service              | Base Path                   | Port |
  | -------------------- | --------------------------- | ---- |
  | User Service         | `/user-service/`            | 3001 |
  | Product Catalog      | `/product-catalog-service/` | 3002 |
  | Shopping Cart        | `/shopping-cart-service/`   | 3003 |
  | Order Service        | `/order-service/`           | 3004 |
  | Notification Service | `/notification-service/`    | 3005 |
  | Payment Service      | `/payment-service/`         | 3006 |

- **Datastores and Brokers**:

  - **PostgreSQL**: Primary relational data store.
  - **Elasticsearch**: Full-text search and analytics.
  - **RabbitMQ**: Message queue for asynchronous workflows.

---

## Accessing APIs via Swagger UI

Each service exposes Swagger UI on its base path. Open these URLs in your browser:

- **User Service**: `http://localhost/user-service/api`
- **Product Catalog**: `http://localhost/product-catalog-service/api`
- **Shopping Cart**: `http://localhost/shopping-cart-service/api`
- **Order Service**: `http://localhost/order-service/api`
- **Notification Service**: `http://localhost/notification-service/api`
- **Payment Service**: `http://localhost/payment-service/api`

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ecommerce-backend.git
cd ecommerce-backend
```

### 2. Configure Environment Variables

Each service has its own `.env` file for secrets and configuration. Copy the example env files or create your own:

```bash
cp services/user-service/.env.example services/user-service/.env
# Repeat for each service under services/
```

Additionally, create a root .env at the repository root to hold global secrets and passwords

Populate values such as database URLs, credentials, and API keys.

### 3. Launch with Docker Compose

```bash
docker-compose up --build
```

This will:

- Build each service image.
- Start PostgreSQL, RabbitMQ, Elasticsearch, and Kibana.
- Start each microservice with healthchecks.
- Start Nginx as reverse proxy on port 80.

### 4. Verify Health

- Nginx: `http://localhost/nginx-health` returns `OK`.
- Each service health endpoint: `http://localhost:{SERVICE_PORT}/health`.

Example:

```bash
curl http://localhost:3001/health
```
