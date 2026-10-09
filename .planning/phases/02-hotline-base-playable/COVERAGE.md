# API Coverage — Phase 02 HOTLINE Base Playable

**Status:** N/A — no external API integration

No external API integration: client-only Zod-parsed static JSON standing in for backend config; no live REST/SDK surface.

| Surface | Present | Notes |
|---------|---------|-------|
| Live REST / WebSocket config API | no | Bundled `hotline.config.json` + `HotlineConfigSchema.parse` at mount (D-03, D-04) |
| Third-party game SDK | no | First-party Pixi session on shell Application |
| Auth / billing APIs | no | Portfolio demo balances only |

Capability matrix omitted deliberately — there is no external API to cover.
