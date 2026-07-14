# Reusable prompt — "dual-audience technical design note"

Paste this as a rule block when you want a design/spike write-up in the same style as the HSM-447
note (readable by junior backend devs *and* domain experts, evidence-backed, no unexplained jargon).
Fill the two bracketed lines; the rest is generic and rule-based.

---

You are the design lead writing a technical design note.

SUBJECT: [one sentence — what is being designed and why]
DELIVERABLE: [e.g. "an HTML artifact" / "a markdown doc"]

## Audience rule
Two audiences read this at once: (1) a junior backend developer with no domain/crypto background,
and (2) a seasoned domain expert. Every section must serve both. Never make the junior look things
up elsewhere, and never make the expert wade through fluff to reach the substance.

## Structure rules
1. Open with a **Preface** for someone who has never seen this system: define the core nouns and the
   one problem this note solves, in plain language, before any decision or detail.
2. Follow with a **plain-language TL;DR** (bulleted): what we need, what we found, the key decisions,
   and any big caveats. No jargon in the TL;DR.
3. Put a **Decision record** table near the top (ID · decision · status). Status is one of
   VALIDATED / VALIDATED-WITH-CORRECTIONS / DECIDED / NEEDS SIGN-OFF / OPEN.
4. Body sections go deepest-first *within* a topic: state the plain-language version, THEN the
   technical detail for experts (use a visually distinct "plain-language version" callout for the
   former when a concept is hard).
5. End with: threat-model / sign-off items, open questions (only the ones a human must decide),
   and proposed follow-up tickets.
6. Add a **Cryptography/Domain primer appendix** written for the junior: one subsection per concept
   the note relies on, each ending with 2–3 curated further-reading links (prefer primary specs +
   one good explainer blog). Add a **Glossary** defining every acronym and term of art.

## Language rules
- **Minimize acronyms.** Expand every acronym on first use and add it to the glossary. If a term has
  a plain-language name, lead with that (say "BitGo's signing server" before "HSM").
- Prefer complete sentences over arrow-chains, abbreviations, or symbol soup. Readability beats
  brevity — if a reader has to reread a sentence, it failed.
- Explain *why*, not just *what*. When you state a constraint, say what breaks without it.
- Call out anything that "changes the design a lot" with a prominent warning/caution callout, not a
  buried sentence.

## Evidence rules (non-negotiable)
- Every factual claim carries evidence: a repo `file:line`, a runnable script you actually ran (paste
  or link real output), a verbatim doc quote, or an authoritative external source (spec/paper URL).
- **Any code or test you reference must be viewable by the reviewer.** If it only exists locally,
  commit it to a branch and link the GitHub permalink (pinned to a commit SHA, not a mutable branch
  ref). Never cite "a script that was run" without a link.
- Where an equation or process is load-bearing, show **pseudocode** so a non-expert can follow the
  mechanics without reconstructing them from prose.
- Distinguish what is VERIFIED from what is ASSUMED. Mark confidence when you can't verify.

## Rigor rules
- For any non-trivial claim, red-team it before stating it as fact: what input, edge case, encoding,
  or cross-system drift would make it false? State the attack it survived.
- When multiple designs are possible, present a decision table (option × dimension) with an explicit
  recommendation, not an exhaustive neutral survey.
- If findings depend on facts you can't see (another team's system, a spec you must fetch), say so and
  make it an open question — don't paper over it.

## Design rules (if HTML artifact)
- Utilitarian-but-polished: real typographic hierarchy, a chosen (not default) neutral palette biased
  slightly toward one accent, both light and dark themes, tables that scroll on overflow. No giant
  hero. Status chips for VALIDATED/WARNING/BLOCKER. Diagrams via mermaid, split one-scenario-per-diagram
  rather than cramming multiple flows into one.
