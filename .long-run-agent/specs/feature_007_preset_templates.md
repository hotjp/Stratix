# Feature 007: Preset Template Library

## Feature Overview
Implement preset hero templates for Writer, Developer, and Analyst agent types.

## Module
stratix-designer

## Priority
P0 (Highest)

## Dependencies
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/templates/index.ts
Export all templates:
```typescript
export { WriterHeroTemplate } from './WriterHeroTemplate';
export { DevHeroTemplate } from './DevHeroTemplate';
export { AnalystHeroTemplate } from './AnalystHeroTemplate';
export type { HeroTemplateBase } from './types';
```

### File: src/stratix-designer/templates/types.ts
```typescript
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export type HeroType = 'writer' | 'dev' | 'analyst';

export interface HeroTemplateBase {
  getTemplate(agentId?: string): StratixAgentConfig;
  getType(): HeroType;
  getName(): string;
  getDescription(): string;
}
```

### File: src/stratix-designer/templates/WriterHeroTemplate.ts
Implements HeroTemplateBase for writer type agent.

### File: src/stratix-designer/templates/DevHeroTemplate.ts
Implements HeroTemplateBase for developer type agent.

### File: src/stratix-designer/templates/AnalystHeroTemplate.ts
Implements HeroTemplateBase for analyst type agent.

## Template Specifications

### Writer Hero Template
| Property | Value |
|----------|-------|
| name | 文案英雄 |
| type | writer |
| soul.identity | 专业文案创作者 |
| soul.goals | 生成文案、优化语言、保持风格 |
| skills | 快速写文案 |
| model | claude-3-sonnet, temp=0.7 |

### Dev Hero Template
| Property | Value |
|----------|-------|
| name | 开发英雄 |
| type | dev |
| soul.identity | 资深程序员 |
| soul.goals | 编写代码、调试bug、优化性能 |
| skills | 编写代码 |
| model | gpt-4o, temp=0.6 |

### Analyst Hero Template
| Property | Value |
|----------|-------|
| name | 数据分析英雄 |
| type | analyst |
| soul.identity | 专业数据分析师 |
| soul.goals | 处理数据、分析趋势、生成报告 |
| skills | 数据分析 |
| model | claude-3-opus, temp=0.5 |

## Template Generation
Each template class generates unique agentId if not provided:
```typescript
agentId: `stratix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
```

## Acceptance Criteria
- [ ] All three templates implement HeroTemplateBase
- [ ] Templates match init.md specifications exactly
- [ ] Generated agentId follows format
- [ ] Skills use correct `stratix-skill-` prefix
- [ ] Model configurations are complete

## Estimated Time
0.5 days
