# Legacy Rules

**Apply these rules ONLY when touching legacy systems, migrations, or backward compatibility concerns.**

## Backward Compatibility

### When Required
- Maintain compatibility with existing APIs
- Preserve data migration paths
- Support deprecated features during transition

### Deprecation Process
- Mark deprecated features clearly
- Provide migration guides
- Maintain deprecated code until migration complete
- Set removal timeline

## Migration Safety

### Data Migrations
- Test migrations on copy of production data
- Create rollback procedures
- Verify data integrity after migration
- Document migration steps

### Code Migrations
- Maintain both old and new code paths during transition
- Use feature flags when possible
- Monitor usage of old vs. new paths
- Remove old code only after migration verified

## Legacy Code Constraints

### When Working with Legacy Code
- Understand existing patterns before changing
- Maintain consistency with existing style
- Document why legacy patterns exist
- Consider full refactoring if legacy code is frequently modified

### Testing Legacy Code
- Add tests before modifying legacy code
- Use characterization tests to document current behavior
- Refactor incrementally with test coverage

## Documentation

### Legacy System Documentation
- Document why legacy systems exist
- Document migration plans
- Document deprecation timelines
- Keep legacy documentation up to date

