# Feature 001: Core Data Storage

## Feature Overview
Implement the core data storage layer using lowdb for Stratix data-store module.

## Module
stratix-data-store

## Priority
High

## Dependencies
- stratix-core (stratix-protocol.ts)
- lowdb
- fs-extra

## Implementation Details

### File: src/stratix-data-store/types.ts
Define all TypeScript types for the data store:
- `StratixDatabase` - Main database schema
- `StratixCommandLog` - Command log structure
- `StratixDatabaseMetadata` - Database metadata

### File: src/stratix-data-store/StratixDataStore.ts
Core storage class implementing:
- Database initialization with lowdb
- Agent configuration CRUD operations
- Template CRUD operations
- Log CRUD operations
- Data export/import for backup

## Key Methods
- `initialize()` - Initialize database with default schema
- `saveAgent(config)` - Save/update agent configuration
- `getAgent(agentId)` - Get agent by ID
- `listAgents()` - List all agents
- `deleteAgent(agentId)` - Delete agent
- `saveCustomTemplate(config)` - Save custom template
- `listTemplates()` - List all templates (preset + custom)
- `deleteCustomTemplate(agentId)` - Delete custom template
- `addLog(log)` - Add command log
- `updateLog(logId, updates)` - Update log entry
- `getLogs(agentId?, limit?)` - Get logs with optional filtering
- `exportData()` - Export all data as JSON
- `importData(jsonData)` - Import data from JSON

## Data Schema
```typescript
interface StratixDatabase {
  version: string;
  agents: StratixAgentConfig[];
  templates: {
    preset: StratixAgentConfig[];
    custom: StratixAgentConfig[];
  };
  logs: StratixCommandLog[];
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}
```

## Acceptance Criteria
- [ ] Database file created at `stratix-data/stratix.db.json`
- [ ] All CRUD operations work correctly
- [ ] metadata.updatedAt updated on every write
- [ ] Logs limited to 100 entries

## Estimated Time
2 days
