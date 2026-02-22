# Feature 012: Phaser Game Scene Core

## Feature Overview
Implement the core Phaser 3 game scene for Stratix RTS, handling map rendering, camera control, and scene lifecycle.

## Module
stratix-rts

## Priority
P0 (Highest)

## Dependencies
- phaser (3.x)
- stratix-core/stratix-protocol.ts
- stratix-core/StratixEventBus.ts

## Implementation Details

### File: src/stratix-rts/StratixRTSGameScene.ts

```typescript
import Phaser from 'phaser';
import StratixEventBus from '@/stratix-core/StratixEventBus';

export default class StratixRTSGameScene extends Phaser.Scene {
  private stratixEventBus: StratixEventBus;
  private agentSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private selectedAgentIds: string[] = [];
  private selectBox: Phaser.Geom.Rectangle | null = null;

  constructor() {
    super('StratixRTSGameScene');
    this.stratixEventBus = StratixEventBus.getInstance();
  }

  preload(): void;
  create(): void;
  update(time: number, delta: number): void;
}
```

## Key Methods

### preload()
- Load star-tile image for map background
- Load hero spritesheet (32x32 frames)
- Load select-box UI image

### create()
- Initialize Stratix map with tilemap (50x30 tiles, 32px each)
- Set camera zoom to 1.2 and bounds
- Initialize player input handlers
- Subscribe to Stratix event bus

### initStratixMap()
- Create tilemap with star theme
- Add tileset and background layer
- Configure camera bounds

## Asset Requirements
| Asset | Path | Description |
|-------|------|-------------|
| stratix-tile | assets/stratix/tile/star-tile.png | Star-themed tile |
| stratix-agent | assets/stratix/agent/hero-sprites.png | Agent spritesheet |
| stratix-select-box | assets/stratix/ui/select-box.png | Selection box |

## Camera Configuration
- Default zoom: 1.2
- Min zoom: 0.8
- Max zoom: 2.0
- Bounds: 0, 0 to map.widthInPixels, map.heightInPixels

## Acceptance Criteria
- [ ] Scene loads without errors
- [ ] Map renders correctly with star theme
- [ ] Camera zoom/pan works within bounds
- [ ] Assets preloaded successfully

## Estimated Time
2 days
