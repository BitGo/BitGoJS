# Express API Docs Batch Migration (WP-7280)

Notes for the Express API docs migration from platform.yaml to generated express.yaml.

## Criteria for new batch endpoints

When adding a route to `express_entry.ts` for doc generation, ensure each endpoint meets:

- **One version per endpoint:** Prefer v2 when both v1 and v2 exist; no `v[12]` in path segments.
- **Tag:** Use `@tag express` (lowercase; matches api-docs approved tag list).
- **Summary (first line):** No punctuation — no periods, commas, colons, semicolons, question marks, exclamation marks, or hyphens. Use e.g. "reencrypt" not "re-encrypt" in the summary.
- **Description:** Add a second paragraph after a blank line so the generated spec has a non-empty `description`. Use full sentences and punctuation in the description only.
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
- **OpenAPI spec quality (missing description / summary punctuation):** The api-docs CI step **"compare OAS static analysis reports"** runs the rule `rules/openapi/openapi-spec-quality`. It fails with "Check OpenAPI specification quality (duplicates, missing descriptions, etc.)" at `content/services/express.yaml` when:
  - **Missing description:** An operation in the generated spec has no `description` field or it is empty. The generator derives this from the route JSDoc: the **first line** becomes `summary`, and the **next paragraph** (after a blank line) becomes `description`. You must have at least two paragraphs so the spec gets a non-empty description. Fix: add a second paragraph to the route JSDoc (e.g. what the endpoint does, supported coins, or behavior).
  - **Summary contains punctuation:** The **summary** (first line of the route JSDoc) must not contain any punctuation. That includes periods, commas, colons, semicolons, question marks, exclamation marks, **and hyphens** (e.g. use "reencrypt" not "re-encrypt" in the summary line). Keep the description paragraph for full sentences and punctuation.
- **Missing x-internal:** Each operation in the generated spec must have an `x-internal` field (true or false). The generator only emitted `x-internal: true` for routes with `@private`. BitGoJS applies a patch to `@api-ts/openapi-generator` (see `patches/`) so the generator always emits `x-internal: true` for `@private` routes and `x-internal: false` otherwise. Ensure `patch-package` runs at postinstall so the patch is applied.
- **Unapproved tag:** The quality check allows only approved tags. Use `@tag express` (lowercase), consistent with other BitGo Express routes and the dev-portal allowlist. Do not use `@tag Express` (capital E) unless that variant is explicitly approved in api-docs.
- **Vacuum / ruleset errors:** Fix the reported OpenAPI or JSDoc issue in the route or schema.

## Express Docs workflow (build-system)

When dispatching the Express Docs workflow manually:

- **branch-name:** Your BitGoJS branch (e.g. `WP-7280-express-api-batch-1`)
- **entry-file:** `modules/express/src/typedRoutes/api/express_entry.ts`
- **dry-run:** `false` to create PRs on api-docs and dev-portal
