# AGENTS.md — MCP Routing (Always Apply)

The agent must choose **exactly one primary MCP** per task. Priority order: **Semantic (code) → Physical (file) → External (web/docs)**. Do not duplicate sources of truth; only persist **stable human decisions**.

---

## 1. Choose MCP by user request type

| User request / Intent | Action: use which MCP |
|------------------------|------------------------|
| **Read or modify existing code** — trace logic, refactor, find symbol, understand flow, fix bug in codebase | → **Serena** (prefer symbolic/overview; avoid reading whole files unless needed). |
| **Plain file operations** — create/edit/delete files, docs, ADRs, config, copy files | → **filesystem**. |
| **View structure / architecture** — map modules, dependencies, packages, overall architecture | → **GKG**. |
| **Long-term memory** — invariants, design decisions, fixed conventions | → **server-memory** (one fact = one short observation). |
| **Look up official API** — official docs, signatures, specific versions | → **Context7**. |
| **Broad research / comparison** — news, tech comparisons, high-level research | → **Perplexity**. |
| **Complex reasoning** — architecture design, hard bug analysis, multi-step planning | → **sequential-thinking**. |

---

## 2. When NOT to use each MCP

- **Serena**: Do not use when you only need simple read/write of files (use filesystem).
- **filesystem**: Do not use when you need code semantics or symbol relationships (use Serena/GKG).
- **GKG**: Do not use when you only need a single symbol in one file (Serena is enough).
- **server-memory**: Do not use for temporary state or information already in code/docs.
- **Context7**: Do not use for open-ended research or broad comparison (use Perplexity).
- **Perplexity**: Do not use when docs/source are already known (use Context7 or Serena).
- **sequential-thinking**: Do not use for simple questions or quick Q&A.

---

## 3. Sources of truth (no duplication)

- **Code truth** → get from **Serena** or **GKG**; do not store copies in memory.
- **Decision truth** (conventions, invariants, ADRs) → **server-memory**; one fact = one short observation.

---

## 4. Quick examples by request

| User says / wants | MCP to use |
|-------------------|------------|
| "Find where function X is called", "Refactor module Y", "Bug in file Z" | **Serena** |
| "Create README", "Write ADR", "Edit config" | **filesystem** |
| "Draw dependencies", "Package structure", "System architecture" | **GKG** |
| "Remember to always use pattern A", "Naming convention B" | **server-memory** |
| "React 19 use() API", "Signature of function X in lib Y" | **Context7** |
| "Compare Next vs Remix", "Latest way to do X" | **Perplexity** |
| "Design login flow", "Analyze root cause of complex bug" | **sequential-thinking** |

If the request does not match any row: follow **Semantic → Physical → External** and pick the single most fitting MCP; do not invoke multiple MCPs for the same purpose.
