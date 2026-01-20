generate-web:
	cd apps/web && pnpm run generate

generate-api:
	oapi-codegen -package api -generate types,gin api-specs/openapi.yaml > apps/api-gateway/internal/api/types.go