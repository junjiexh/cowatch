generate-web:
	cd apps/web && pnpm run generate

generate-api:
	oapi-codegen -package api -generate types,gin api-specs/openapi.yaml > apps/api-gateway/internal/api/types.go

# Prism Mock Server
mock:
	cd apps/web && pnpm exec prism mock ../../api-specs/openapi.yaml -p 8080

mock-dynamic:
	cd apps/web && pnpm exec prism mock ../../api-specs/openapi.yaml -p 8080 --dynamic