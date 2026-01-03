# Cursor Rules System Migration

This document describes the migration from the monolithic `.cursorrules` file to the modern directory-based structure.

## Migration Date
2024 (migration completed)

## Structure

```
.cursor/
├── instructions.md    # How to use the rule system
└── rules/
    ├── core.md        # Always-applicable rules
    ├── backend.md     # Backend-specific rules
    ├── frontend.md    # Frontend-specific rules
    ├── testing.md     # Testing-specific rules
    ├── refactoring.md # Refactoring-specific rules
    └── legacy.md      # Legacy system rules
```

## Key Improvements

1. **Context-Based Organization**: Rules are now organized by when they apply, reducing cognitive load.

2. **Reduced Redundancy**: Eliminated duplicate and overlapping rules.

3. **Clearer Application**: `.cursor/instructions.md` explains when to consult which rule file.

4. **Improved Autonomy**: Rules are more declarative and unambiguous, enabling better agent autonomy.

5. **Enhanced Rule Retention**: Added explicit checklists and priority markers to prevent rule loss during long conversations.

## Migration Notes

- ~~Original `.cursorrules` file preserved for reference~~ (removed after migration)
- All rules from `.cursorrules` have been classified and refactored
- Rules are now more concise and declarative
- Context-specific rules only apply when relevant
- Added priority markers ([P0], [CRITICAL], [MANDATORY]) to critical rules
- Added explicit checklists for work start, mid-work, and completion

## Usage

See `.cursor/instructions.md` for detailed usage instructions.

## Backward Compatibility

**Status**: The old `.cursorrules` file has been removed. The `.cursor/` directory structure is now the single source of truth. Cursor will use the `.cursor/` directory structure when present.

## Related Documents

- `.cursor/instructions.md`: How to use the rule system
- `.cursor/rules/core.md`: Core rules (always apply)
- `DEVELOPMENT_GUIDELINES.md`: Full development guidelines

