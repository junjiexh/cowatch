generate-web:
	cd apps/web && pnpm run generate

generate-api:
	oapi-codegen -package api -generate types,gin api-specs/openapi.yaml > apps/api-gateway/internal/api/types.go

# Prism Mock Server
mock:
	cd apps/web && pnpm run mock

# Frontend Development Server
dev-web:
	cd apps/web && pnpm run dev

dev-mock-web:
	cd apps/web && pnpm run dev-mock

# API Gateway
dev-api:
	cd apps/api-gateway && go run cmd/api/main.go

test-api:
	cd apps/api-gateway && go test ./... -v

test-api-coverage:
	cd apps/api-gateway && go test ./... -cover -coverprofile=coverage.out

build-api:
	cd apps/api-gateway && go build -o bin/api-gateway cmd/api/main.go

# Database
db-up:
	docker-compose -f docker/docker-compose.yml up -d

db-down:
	docker-compose -f docker/docker-compose.yml down

db-logs:
	docker-compose -f docker/docker-compose.yml logs -f postgres