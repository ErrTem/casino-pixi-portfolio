---
schema_version: 1
open_count: 0
waived_count: 1
fixed_count: 0
total_count: 1
last_updated: 2026-10-09T17:06:02.167Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/shell/gameRegistry.ts |  | HOTLINE enabled:false Coming soon stub intentional until Phase 2 | waived | Intentional Phase 1 HOTLINE stub; Phase 2 enables launch | 2026-10-09T17:05:40.386Z | 2026-10-09T17:06:02.167Z |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/shell/gameRegistry.ts",
    "line": null,
    "description": "HOTLINE enabled:false Coming soon stub intentional until Phase 2",
    "status": "waived",
    "reason": "Intentional Phase 1 HOTLINE stub; Phase 2 enables launch",
    "recorded_at": "2026-10-09T17:05:40.386Z",
    "resolved_at": "2026-10-09T17:06:02.167Z",
    "milestone": "v1.0"
  }
]
````
