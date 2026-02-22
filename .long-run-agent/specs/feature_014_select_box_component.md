# Feature 014: Select Box Component

## Feature Overview
Implement the drag selection box component for multi-agent selection in the RTS interface.

## Module
stratix-rts

## Priority
P1 (High)

## Dependencies
- phaser (3.x)
- feature_012 (Phaser Game Scene Core)
- feature_013 (Agent Sprite System)

## Implementation Details

### File: src/stratix-rts/ui/SelectBox.ts

```typescript
import Phaser from 'phaser';

export interface SelectBoxConfig {
  lineColor: number;
  fillColor: number;
  lineWidth: number;
  fillAlpha: number;
}

export class SelectBox {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private rectangle: Phaser.Geom.Rectangle | null = null;
  private startPoint: { x: number; y: number } | null = null;
  private config: SelectBoxConfig;

  constructor(scene: Phaser.Scene, config?: Partial<SelectBoxConfig>);
  public start(x: number, y: number): void;
  public update(x: number, y: number): void;
  public end(): Phaser.Geom.Rectangle | null;
  public getBounds(): Phaser.Geom.Rectangle | null;
  public isVisible(): boolean;
  public destroy(): void;
}
```

## Key Methods

### constructor(scene, config)
Default configuration:
```typescript
{
  lineColor: 0x00ff00,  // Green border
  fillColor: 0x00ff00,  // Green fill
  lineWidth: 2,
  fillAlpha: 0.2        // Semi-transparent
}
```

### start(x, y)
- Record start point
- Initialize rectangle at (x, y) with zero size
- Set visibility flag

### update(x, y)
- Calculate width/height from start point to current point
- Handle negative dimensions (drag left/up)
- Clear and redraw graphics

### end()
- Finalize selection rectangle
- Return bounds for collision detection
- Hide graphics (keep for next use)

### getBounds()
Return normalized rectangle (positive width/height)

## Visual Design
```
  ┌──────────────────┐
  │░░░░░░░░░░░░░░░░░░│ ← Green semi-transparent fill
  │░░░░░░░░░░░░░░░░░░│
  │░░░ [Agent1] ░░░░░│
  │░░░░░ [Agent2] ░░░│
  └──────────────────┘
    ↑ Green border (2px)
```

## Selection Logic
```typescript
// In StratixRTSGameScene
private selectMultipleAgentsByBox(): void {
  const bounds = this.selectBox.getBounds();
  if (!bounds) return;
  
  this.selectedAgentIds = [];
  this.agentSprites.forEach((sprite, agentId) => {
    if (Phaser.Geom.Rectangle.Contains(bounds, sprite.x, sprite.y)) {
      sprite.highlight(true);
      this.selectedAgentIds.push(agentId);
    } else {
      sprite.highlight(false);
    }
  });
}
```

## Acceptance Criteria
- [ ] Box appears on drag start
- [ ] Box follows mouse during drag
- [ ] Box handles all drag directions
- [ ] Green border and semi-transparent fill
- [ ] Returns correct bounds for selection
- [ ] Cleared on mouse up

## Estimated Time
1 day
