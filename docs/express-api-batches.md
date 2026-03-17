# Express API Docs Batch Migration (WP-7280)

Notes for the Express API docs migration from platform.yaml to generated express.yaml.

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
- **Missing description / summary punctuation:** Fix the route file JSDoc per the OpenAPI quality checks (no punctuation in summary, multi-line descriptions, request body JSDoc).
- **Vacuum / ruleset errors:** Fix the reported OpenAPI or JSDoc issue in the route or schema.

## Express Docs workflow (build-system)

When dispatching the Express Docs workflow manually:

- **branch-name:** Your BitGoJS branch (e.g. `WP-7280-express-api-batch-1`)
- **entry-file:** `modules/express/src/typedRoutes/api/express_entry.ts`
- **dry-run:** `false` to create PRs on api-docs and dev-portal
