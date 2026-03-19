# Express API Docs Batch Migration (WP-7280)

Notes for the Express API docs migration from platform.yaml to generated express.yaml.

## Criteria for new batch endpoints

When adding a route to `express_entry.ts` for doc generation, ensure each endpoint meets:

- **One version per endpoint:** Prefer v2 when both v1 and v2 exist; no `v[12]` in path segments.
- **Tag:** Use `@tag Express` in the route JSDoc (same as the first batch).
- **Summary (first line):** No punctuation — no periods, commas, colons, semicolons, question marks, exclamation marks, or hyphens in the summary line (openapi-spec-quality).
- **Description:** Add a second paragraph after a blank line so the generated spec has a non-empty `description`. Use full sentences and punctuation in the description body as needed.
- **Request body:** Document body fields in JSDoc for POST/PUT where applicable.
- **External only:** Do not use `@private`; batch endpoints are for the public spec.

## Pipeline Failures and Mitigations

### Transient npm registry errors (502 Bad Gateway, 403, etc.)

**What happened (e.g. [run 23118072675](https://github.com/BitGo/build-system/actions/runs/23118072675)):**

- Job **"Audit API spec / Generate new or use handwritten OpenAPI spec for express.yaml"** fails during **Install package dependencies** (yarn install).
- Error: `Request failed "502 Bad Gateway"` (or similar) when fetching a package from `registry.npmjs.org` (e.g. `ws`).
- Job **"Audit API spec / API Spec Check"** then fails because it depends on the artifact from the first job (step "Check generate-openapi-spec-or-use-handwritten").

**Cause:** Infrastructure/network — transient npm registry or network issue, **not** a problem in BitGoJS or the batch code.

**What to do:**

1. **Re-run the failed workflow** (Actions → run → "Re-run failed jobs"). No code changes needed.
2. If it fails again with the same registry error, wait and re-run later or ask DevOps/build-system owners to add retries or use a mirror.

**Do not:** Change dependencies or batch code in response to 502/403 from npm; the failure is outside our control.

### Other pipeline failures

- **TypeScript / clientRoutes errors:** If the audit fails with `Argument of type '"express.xxx"' is not assignable`, the route key in `clientRoutes.ts` does not match the key in `express_entry.ts` / `index.ts`. Fix the handler registration and type to use the same operation key.
- **OpenAPI spec quality (missing description / summary punctuation):** The api-docs CI step **"compare OAS static analysis reports"** runs the rule `rules/openapi/openapi-spec-quality`. It fails when an operation is missing a non-empty `description` or the summary contains disallowed punctuation. In JSDoc, the first line is `summary`; the next paragraph (after a blank line) is `description`.
- **Vacuum / ruleset errors:** Fix the reported OpenAPI or JSDoc issue in the route or schema.

## Express Docs workflow (build-system)

When dispatching the Express Docs workflow manually:

- **branch-name:** Your BitGoJS branch (e.g. `WP-7280-express-api-batch-1`)
- **entry-file:** `modules/express/src/typedRoutes/api/express_entry.ts`
- **dry-run:** `false` to create PRs on api-docs and dev-portal
