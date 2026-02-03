# AGENTS.md — MCP Routing Cheat Sheet

## Golden rules
- Use **ONE primary MCP** per task
- Semantic → Physical → External
- Persist only **stable human decisions**
- Never duplicate sources of truth

---

## MCP Router

| MCP | Use when you need… | Avoid when… |
|---|---|---|
| **Serena** | Understand / modify existing code | Only file I/O |
| **filesystem** | Read/write/create files | Code semantics |
| **GKG** | Architecture & dependencies | Single symbol |
| **server-memory** | Long-term decisions & rules | Temporary state |
| **Context7** | Exact official APIs | Exploratory research |
| **Perplexity** | Broad / up-to-date web info | Docs already known |
| **sequential-thinking** | Hard design / planning / resolve complicated issues or errors | Simple Q&A |

---

## Memory policy
- **Code truth** → Serena / GKG  
- **Decision truth** → server-memory  
- One fact = one short observation

---

## Quick routing examples
- Trace logic / refactor → **Serena**
- Create ADR / doc → **filesystem**
- Map system structure → **GKG**
- Remember invariant → **server-memory**
- Check exact API → **Context7**
- Compare approaches → **Perplexity**
- Design architecture → **sequential-thinking**

