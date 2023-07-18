---
"@thinknimble/tn-models-fp": patch
---

Fix readonly fields not working properly on create model override. Now readonly fields should be completely ignored for create model override. Allowing you to re-use your entity models that have readonly fields in case you want to.
