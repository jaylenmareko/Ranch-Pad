---
name: api-docs
description: Write, structure, and improve API documentation, technical guides, README files, and developer-facing content. Use when the user mentions "API docs", "documentation", "README", "developer guide", "OpenAPI", "Swagger", "endpoint docs", "code examples", "technical writing", or "document this API".
metadata:
  version: 1.0.0
---

# API Documentation Skill

Documentation that gets developers to their first successful API call in under 10 minutes.

---

## Before Starting

1. **Audience** — Internal devs, external partners, or public API?
2. **API type** — REST, GraphQL, WebSocket, SDK?
3. **Auth method** — API key, OAuth, JWT, bearer token?
4. **Existing docs** — Migrating/improving or starting from scratch?
5. **Format** — Markdown, OpenAPI spec, hosted platform (Readme.io, Mintlify, GitBook)?

---

## Documentation Structure

### Standard REST API Doc Structure

```
1. Overview
   - What the API does (1-2 sentences)
   - Base URL
   - Authentication method
   - Rate limits
   - Versioning policy

2. Quickstart
   - Get credentials
   - Make your first call (working code example)
   - What to expect back

3. Authentication
   - How to get keys/tokens
   - How to include them in requests
   - Token refresh / expiry handling

4. Endpoints (by resource)
   - List endpoint
   - Get single endpoint
   - Create endpoint
   - Update endpoint
   - Delete endpoint

5. Error Reference
   - Error format
   - Error codes table

6. SDKs & Libraries (if applicable)

7. Changelog
```

---

## Endpoint Documentation Template

```markdown
## POST /animals

Create a new animal record.

**Authentication:** Bearer token required

**Request**

\`\`\`http
POST /v1/animals
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

\`\`\`json
{
  "tag_id": "TX-4821",
  "species": "cattle",
  "breed": "Angus",
  "birth_date": "2023-04-15",
  "weight_lbs": 650
}
\`\`\`

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tag_id | string | Yes | Unique ear tag identifier |
| species | string | Yes | Animal species: `cattle`, `sheep`, `goat` |
| breed | string | No | Breed name |
| birth_date | string | No | ISO 8601 date (YYYY-MM-DD) |
| weight_lbs | number | No | Current weight in pounds |

**Response**

\`\`\`json
{
  "id": "anml_7f8d9e",
  "tag_id": "TX-4821",
  "species": "cattle",
  "created_at": "2026-05-24T10:30:00Z"
}
\`\`\`

**Status codes**

| Code | Description |
|------|-------------|
| 201 | Animal created successfully |
| 400 | Invalid request — see `error.message` |
| 401 | Authentication failed |
| 409 | `tag_id` already exists |
```

---

## Writing Principles

### Lead with working code
Developers trust code more than prose. Show a real, copy-pasteable example before explaining parameters.

### Use the right language
Match the language of your code examples to what your users actually use. If 80% use Python, lead with Python.

### Be explicit about defaults
Never make a developer guess what happens if they omit a field.

### Document errors as carefully as success
Developers spend more time debugging errors than reading happy-path docs. Every error code needs a description and a fix.

### Versioning matters
Every breaking change needs a migration guide, not just a changelog entry.

---

## README Template (for open source / SDKs)

```markdown
# [Project Name]

[One sentence: what it does and who it's for]

## Install

\`\`\`bash
npm install your-package
# or
pip install your-package
\`\`\`

## Quickstart

\`\`\`javascript
// Working example — copy and run
const client = new YourClient({ apiKey: 'your-key' });
const result = await client.animals.create({ tag_id: 'TX-1234' });
console.log(result.id);
\`\`\`

## Authentication

[How to get and use credentials]

## Core concepts

[2-3 concepts a developer must understand to use the API effectively]

## API Reference

[Link to full docs]

## Contributing

[Link to contributing guide]

## License

[License type]
```

---

## OpenAPI / Swagger Tips

```yaml
# Every endpoint needs:
summary: Short action description (verb + noun)
description: When to use this and what it does
operationId: camelCase unique identifier
tags: [ResourceName]  # Groups endpoints in UI
parameters:
  - in: path / query / header / cookie
    name: paramName
    required: true/false
    schema:
      type: string
    description: What this parameter does
responses:
  '200':
    description: Success description
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/YourModel'
        example:        # Always include a real example
          id: "abc123"
  '400':
    $ref: '#/components/responses/BadRequest'
```

---

## Error Reference Template

```markdown
## Error Format

All errors return a consistent JSON body:

\`\`\`json
{
  "error": {
    "code": "invalid_tag_id",
    "message": "tag_id must be unique across your account",
    "docs": "https://docs.yourapp.com/errors/invalid_tag_id"
  }
}
\`\`\`

## Error Codes

| Code | HTTP Status | Cause | Fix |
|------|-------------|-------|-----|
| `auth_required` | 401 | Missing or invalid Bearer token | Include `Authorization: Bearer {token}` header |
| `invalid_tag_id` | 400 | tag_id format invalid or duplicate | Use alphanumeric, max 20 chars |
| `rate_limit_exceeded` | 429 | Too many requests | Wait and retry after `Retry-After` header value |
| `not_found` | 404 | Resource doesn't exist | Check the ID and your account permissions |
```

---

## Changelog Format

```markdown
## v2.1.0 — 2026-05-24

### Added
- `GET /animals/{id}/health-history` endpoint
- `weight_kg` field as alternative to `weight_lbs`

### Changed
- `breed` field now accepts freeform text (was enum)

### Deprecated
- `POST /animals/batch` — use `/animals/bulk` instead (removed in v3.0)

### Fixed
- `created_at` now returns UTC timezone consistently
```

---

## Related Skills

- **pm-framework** — For documenting features before the API is built
- **error-handling-patterns** — For deciding what errors to expose
- **site-architecture** — For structuring a developer portal
