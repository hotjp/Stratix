# Feature 006: Config Validator & Converter

## Feature Overview
Implement configuration validation and conversion utilities for ensuring config integrity and format transformation.

## Module
stratix-designer

## Priority
P0 (Highest)

## Dependencies
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/utils/ConfigValidator.ts

```typescript
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export interface ValidationResult {
  valid: boolean;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ConfigValidator {
  public static validate(config: StratixAgentConfig): ValidationResult;
  public static validateAgentId(agentId: string): boolean;
  public static validateSoul(soul: StratixSoulConfig): ValidationResult;
  public static validateSkills(skills: StratixSkillConfig[]): ValidationResult;
  public static validateModel(model: StratixModelConfig): ValidationResult;
  public static validateOpenClawConfig(config: StratixOpenClawConfig): ValidationResult;
}
```

### File: src/stratix-designer/utils/ConfigConverter.ts

```typescript
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export class ConfigConverter {
  public static toOpenClawFormat(config: StratixAgentConfig): OpenClawAgentConfig;
  public static fromOpenClawFormat(openClawConfig: OpenClawAgentConfig): StratixAgentConfig;
  public static toJson(config: StratixAgentConfig, pretty?: boolean): string;
  public static fromJson(json: string): StratixAgentConfig;
  public static mergeConfigs(base: StratixAgentConfig, override: Partial<StratixAgentConfig>): StratixAgentConfig;
}
```

## Key Methods

### ConfigValidator.validate(config)
Validate complete agent configuration:
1. Check required fields (agentId, name, type)
2. Validate agentId format (`stratix-` prefix)
3. Validate soul structure
4. Validate skills (at least one required)
5. Validate model config
6. Validate openClawConfig (accountId, endpoint required)

### ConfigValidator.validateAgentId(agentId)
- Must start with `stratix-`
- Must contain timestamp component
- Must contain random suffix

### ConfigConverter.toOpenClawFormat(config)
Transform StratixAgentConfig to OpenClaw native format:
```typescript
{
  account_id: config.openClawConfig.accountId,
  endpoint: config.openClawConfig.endpoint,
  model: config.model.name,
  model_params: config.model.params,
  system_prompt: buildSystemPrompt(config.soul),
  tools: convertSkillsToTools(config.skills)
}
```

### ConfigConverter.mergeConfigs(base, override)
Deep merge two configurations with override taking precedence.

## Validation Rules

| Field | Rule |
|-------|------|
| agentId | Required, starts with `stratix-` |
| name | Required, non-empty string |
| type | Required, one of: writer, dev, analyst |
| soul.identity | Required, non-empty |
| soul.goals | Required, at least one goal |
| skills | Required, at least one skill |
| skills[].skillId | Required, starts with `stratix-skill-` |
| model.name | Required, non-empty |
| openClawConfig.accountId | Required, non-empty |
| openClawConfig.endpoint | Required, valid URL |

## Acceptance Criteria
- [ ] All validation rules implemented
- [ ] Clear error messages for each validation failure
- [ ] OpenClaw format conversion produces valid output
- [ ] Merge preserves all required fields
- [ ] Unit tests cover all edge cases

## Estimated Time
0.5 days
