# Feature 013: Agent Sprite System

## Feature Overview
Implement the Agent sprite system for rendering and managing Agent entities on the RTS map.

## Module
stratix-rts

## Priority
P0 (Highest)

## Dependencies
- phaser (3.x)
- stratix-core/stratix-protocol.ts
- feature_012 (Phaser Game Scene Core)

## Implementation Details

### File: src/stratix-rts/sprites/AgentSprite.ts

```typescript
import Phaser from 'phaser';
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';
export type CommandStatus = 'pending' | 'running' | 'success' | 'failed';

export class AgentSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private statusIndicator: Phaser.GameObjects.Graphics;
  private agentId: string;
  private agentName: string;
  private currentStatus: AgentStatus;

  constructor(scene: Phaser.Scene, x: number, y: number, config: StratixAgentConfig);
  public setAgentStatus(status: AgentStatus): void;
  public setCommandStatus(status: CommandStatus): void;
  public getAgentId(): string;
  public highlight(selected: boolean): void;
}
```

## Key Methods

### constructor(scene, x, y, config)
- Create sprite with hero spritesheet
- Add name label above sprite
- Create status indicator circle
- Set interactive for click detection
- Store agentId in data

### setAgentStatus(status)
Update visual appearance based on Agent status:
| Status | Color | Animation |
|--------|-------|-----------|
| online | 0x00ff00 (Green) | None |
| offline | 0x888888 (Gray) | Dimmed |
| busy | 0xffff00 (Yellow) | Pulse |
| error | 0xff0000 (Red) | Shake |

### setCommandStatus(status)
Update visual feedback for command execution:
| Status | Color | Effect |
|--------|-------|--------|
| pending | 0x00ffff (Cyan) | Loading spinner |
| running | 0xffff00 (Yellow) | Progress bar |
| success | 0x00ff00 (Green) | Flash + fade |
| failed | 0xff0000 (Red) | Shake |

### highlight(selected)
- Selected: Green tint (0x00ff00)
- Deselected: White tint (0xffffff)

## Visual Design
```
     [Agent Name]
         ●  (status indicator)
       ┌───┐
       │ 🧙 │ (hero sprite 32x32)
       └───┘
```

## Acceptance Criteria
- [ ] Agent sprites render at correct positions
- [ ] Name label displays above sprite
- [ ] Status colors match specification
- [ ] Command status animations work
- [ ] Selection highlight visible
- [ ] Click detection works

## Estimated Time
2 days
