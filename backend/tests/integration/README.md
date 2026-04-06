# Integration Tests

## Requirements

Integration tests require **Docker Desktop** to be installed and running on your machine. Tests use testcontainers-go to spin up isolated PostgreSQL instances for testing.

## Running Tests

To run integration tests:
```bash
# Only integration tests (requires Docker)
go test ./tests/integration/... -tags=integration -v

# All tests (unit + integration)
go test ./... -tags=integration -v
```

## Current Status

Integration tests are set up using testcontainers approach but require Docker Desktop to be installed. If Docker is not available, tests will fail.

## Next Steps

1. Install Docker Desktop
2. Restart Docker Desktop
3. Re-run integration tests

## Note for Windows

The testcontainers-go library works on Windows but requires Docker Desktop to be running. If you're using WSL2, you can run Docker inside WSL2 instead of Docker Desktop.
