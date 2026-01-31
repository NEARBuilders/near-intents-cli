# near-intents-cli

## 0.3.0

### Minor Changes

- 9d1463a: Add Transfer Operations between two near-intents addresses

## 0.2.0

### Minor Changes

- 820d6d4: Improve command error handling and type safety across the CLI

### Patch Changes

- 0a9b0fb: adds changeset support for automatic releases
- b212a69: Fix command improvements for config, swap, and withdraw commands

  - Add proper type handling for KeyPair in config command with KeyPairString type assertion
  - Improve swap command with success/error status handling
  - Improve withdraw command with success/error status handling
  - Update success message from "completed" to "submitted" for accuracy
  - Reorder imports alphabetically for consistency

- ffc0287: enable releases
- 03b1db1: feat: add tests
