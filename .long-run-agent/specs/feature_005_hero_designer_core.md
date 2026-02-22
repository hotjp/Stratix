# Feature 005: StratixHeroDesigner Core Class

## Feature Overview
Implement the core logic class for the Hero Designer module, handling hero creation, saving, import/export, and template management.

## Module
stratix-designer

## Priority
P0 (Highest)

## Dependencies
- stratix-core (stratix-protocol.ts)
- stratix-core (StratixEventBus)
- ./templates/* (preset templates)
- ./utils/ConfigValidator
- axios
- file-saver

## Implementation Details

### File: src/stratix-designer/StratixHeroDesigner.ts

```typescript
import { 
  StratixAgentConfig, 
  StratixApiResponse, 
  StratixCreateAgentRequest 
} from '@/stratix-core/stratix-protocol';
import axios from 'axios';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import { saveAs } from 'file-saver';
import { ConfigValidator } from './utils/ConfigValidator';
import { WriterHeroTemplate, DevHeroTemplate, AnalystHeroTemplate } from './templates';

export class StratixHeroDesigner {
  private stratixEventBus: StratixEventBus;
  private currentConfig: StratixAgentConfig | null = null;
  private presetTemplates: StratixAgentConfig[];

  constructor() {
    this.stratixEventBus = StratixEventBus.getInstance();
    this.presetTemplates = [
      new WriterHeroTemplate().getTemplate(),
      new DevHeroTemplate().getTemplate(),
      new AnalystHeroTemplate().getTemplate()
    ];
  }

  public createNewHero(heroType: 'writer' | 'dev' | 'analyst'): StratixAgentConfig;
  public async saveHeroConfig(config: StratixAgentConfig): Promise<StratixApiResponse>;
  public importHeroConfig(configJson: string): StratixAgentConfig;
  public exportHeroConfig(agentId?: string): string;
  public getPresetTemplates(): StratixAgentConfig[];
  public getCurrentConfig(): StratixAgentConfig | null;
  public async loadHeroConfig(agentId: string): Promise<StratixAgentConfig>;
  public async deleteHeroConfig(agentId: string): Promise<StratixApiResponse>;
}
```

## Key Methods

### createNewHero(heroType)
- Generate unique agentId with format `stratix-{timestamp}-{random}`
- Clone corresponding template based on heroType
- Set as currentConfig
- Return new config

### saveHeroConfig(config)
- Validate config using ConfigValidator
- POST to `/api/stratix/config/agent/save`
- Emit `stratix:config_updated` event
- Return API response

### importHeroConfig(configJson)
- Parse JSON string
- Apply default values for missing fields
- Validate parsed config
- Set as currentConfig
- Return config

### exportHeroConfig(agentId?)
- Get config from currentConfig or presetTemplates
- Generate JSON blob
- Trigger file download using file-saver
- Return JSON string

### loadHeroConfig(agentId)
- GET from `/api/stratix/config/agent/get?agentId=xxx`
- Set as currentConfig
- Return config

### deleteHeroConfig(agentId)
- DELETE to `/api/stratix/config/agent/delete`
- Emit `stratix:config_deleted` event
- Return API response

## API Endpoints Used
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/stratix/config/agent/save | Save agent config |
| GET | /api/stratix/config/agent/get | Load agent config |
| DELETE | /api/stratix/config/agent/delete | Delete agent config |

## Events Emitted
| Event Type | Payload | When |
|------------|---------|------|
| stratix:config_updated | { agentId, data } | After save |
| stratix:config_deleted | { agentId } | After delete |

## Acceptance Criteria
- [ ] Unique agentId generation follows format
- [ ] All API calls properly typed
- [ ] Event bus integration works
- [ ] Import handles malformed JSON gracefully
- [ ] Export downloads correct file

## Estimated Time
1 day
