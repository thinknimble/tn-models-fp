---
"@thinknimble/tn-models": minor
---

Add built-in `createWSAdapter` helper for wrapping raw WebSocket libraries (like `ws`) into a `WSClientLike` compatible with `createWSApi`. No new dependencies — accepts any object with `send(data)`, `on(event, handler)`, `readyState`, and `OPEN`.
