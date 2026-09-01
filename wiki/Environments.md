# Environments & Variables

Environments let you switch between different API targets (e.g. Local, Staging, Production) effortlessly, without modifying your request files.

---

## Environment Files

Environments live inside `.dakiya/environments/`:

```
.dakiya/
  environments/
    local.yaml
    staging.yaml
    production.yaml
```

Each environment is a simple YAML file defining key-value pairs:

```yaml
# .dakiya/environments/local.yaml
baseUrl: "http://localhost:3000"
apiKey: "dev-api-key-xyz"
userEmail: "admin@localhost.dev"
```

```yaml
# .dakiya/environments/production.yaml
baseUrl: "https://api.example.com"
apiKey: "prod-secret-key-123"
userEmail: "admin@example.com"
```

---

## Using Variables in Requests

You can reference environment variables anywhere in your `requests.yaml` using the `{{variableName}}` double curly brace syntax:

- **URLs**: `{{baseUrl}}/v1/users`
- **Headers**: `Authorization: Bearer {{token}}`
- **Query Params**: `page={{pageNumber}}`
- **Request Body**: `{"userId": "{{userId}}"}`

---

## Switching Environments

### In the Web Dashboard
1. Open the dashboard via `dakiya serve`.
2. Use the environment dropdown at the top of the sidebar to select your active environment.
3. Edit variable values directly on the **Environments** page.

### In Scripts
Sandbox scripts can read and modify environment variables on the fly (for example, saving a login token for subsequent requests).

---
**Next:** Learn how to write [Pre & Post Request Scripts](./Scripts.md)!
