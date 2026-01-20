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