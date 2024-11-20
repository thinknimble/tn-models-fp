---
"@thinknimble/tn-models": major
---

# Breaking changes

Remove `readonly` library util in favor of native `z.ZodReadonly`.

Upgrades should remove the library `readonly` since it is not going to be handled anymore.

## Reasoning

Zod recently released a native way of handling readonly. Although this readonly is not exactly the same as what we call "readonly" from our db resources. It does allow us to mark fields as readonly and we can take advantage of this mark and make the corresponding type inferences to treat these fields as our own readonly.

## Migration guide

- Upgrade Zod to >=3.23.8
- Remove any `import {readonly} from '@thinknimble/tn-models'`
- Replace any `readonly(zod)` with `zod.readonly()` which is the native way of doing this with zod
- That should be it!
