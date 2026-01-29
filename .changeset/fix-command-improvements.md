---
"near-intents-cli": patch
---

Fix command improvements for config, swap, and withdraw commands

- Add proper type handling for KeyPair in config command with KeyPairString type assertion
- Improve swap command with success/error status handling
- Improve withdraw command with success/error status handling
- Update success message from "completed" to "submitted" for accuracy
- Reorder imports alphabetically for consistency
