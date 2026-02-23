# Feature feature_001 - 角色生成器模块技术规格文档

## 元信息
- **优先级**: P0（核心功能模块）
- **负责人**: 待分配
- **预计工时**: 3-4 周
- **创建时间**: 2026-02-22 22:33:50
- **参考项目**: [Universal-LPC-Spritesheet-Character-Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
- **资源路径**: `assets/spritesheets/` (已复制 LPC 素材)

## 功能描述

角色生成器模块（CharacterCreator）是基于 LPC（Liberated Pixel Cup）开源素材的角色定制系统，提供：

1. **精灵拼接生成**：按层级（shadow→body→legs→torso→arms→head→weapon）动态合成角色精灵贴图
2. **部位自定义**：支持头部、身体、腿部、服装、武器等 22+ 部位分类，每部位多变体
3. **实时预览**：生成/自定义过程中实时展示动画预览（walk/idle/slash 等 15+ 动画）
4. **技能树交互**：可视化技能配置，属性实时计算
5. **角色持久化**：IndexedDB 存储角色配置，支持角色管理（增删改查）

## 技术架构设计

### 1. 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    CharacterCreator Scene                        │
│  (Phaser.Scene - 模块入口)                                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ SpriteRenderer│  │   UI Layer   │  │  SkillTree   │           │
│  │  (精灵渲染)   │  │  (DOM/Phaser)│  │   (技能树)   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│  ┌──────▼─────────────────▼─────────────────▼───────┐           │
│  │              CharacterComposer                    │           │
│  │            (角色组合器 - 核心逻辑)                  │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────┐               │
│  │              PartRegistry                     │               │
│  │    (部位注册表 - 元数据/路径/zPos管理)          │               │
│  └──────────────────────┬───────────────────────┘               │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────┐               │
│  │              CharacterStorage                 │               │
│  │       (IndexedDB 持久化层)                     │               │
│  └──────────────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                    StratixEventBus (跨模块通信)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. LPC 精灵拼接核心算法

基于 LPC 项目的 `renderer.js` 实现，采用**层级叠加 + Y 偏移**方案：

#### 2.1 精灵表格式规范
```typescript
// 画布尺寸
const SHEET_WIDTH = 832;   // 13帧 × 64px
const SHEET_HEIGHT = 3456; // 54行 × 64px
const FRAME_SIZE = 64;     // 单帧尺寸

// 动画 Y 偏移量（像素）
const ANIMATION_OFFSETS = {
  spellcast: 0,        // 行 0-3
  thrust: 256,         // 行 4-7
  walk: 512,           // 行 8-11
  slash: 768,          // 行 12-15
  shoot: 1024,         // 行 16-19
  hurt: 1280,          // 行 20
  climb: 1344,         // 行 21
  idle: 1408,          // 行 22-25
  jump: 1664,          // 行 26-29
  sit: 1920,           // 行 30-33
  emote: 2176,         // 行 34-37
  run: 2432,           // 行 38-41
  combat_idle: 2688,   // 行 42-45
  backslash: 2944,     // 行 46-49
  halfslash: 3200      // 行 50-53
};
```

#### 2.2 层级顺序（zPos 从小到大绘制）
```typescript
const LAYER_Z_POSITIONS = {
  shadow: 0,       // 阴影（最底层）
  body: 10,        // 身体
  legs: 20,        // 腿部
  feet: 25,        // 足部
  torso: 40,       // 躯干/衣服
  dress: 45,       // 裙装
  arms: 50,        // 手臂
  armor: 60,       // 盔甲
  cape: 70,        // 披风
  head: 80,        // 头部
  hair: 85,        // 头发
  hat: 90,         // 帽子
  weapon: 100      // 武器（最顶层）
};
```

#### 2.3 路径构建规则
```
assets/spritesheets/{category}/{type}/{bodyType}/{animation}/{variant}.png

示例：
assets/spritesheets/body/bodies/male/walk/light.png
assets/spritesheets/hair/long/female/idle/brunette.png
assets/spritesheets/weapon/sword/male/slash/steel.png
```

### 3. 核心接口设计

#### 3.1 CharacterComposer（角色组合器）
```typescript
interface PartSelection {
  itemId: string;      // 如 "body_male"
  variant: string;     // 如 "light", "brunette"
}

interface ComposeOptions {
  bodyType: 'male' | 'female' | 'teen' | 'muscular' | 'pregnant';
  animations?: string[];  // 需要生成的动画列表，默认全部
  targetCanvas?: HTMLCanvasElement;  // 可选的目标画布
}

interface ComposeResult {
  canvas: HTMLCanvasElement;  // 合成后的精灵表
  parts: PartInfo[];          // 使用的部位信息
  credits: CreditInfo[];      // 作者署名信息（LPC 要求）
}

class CharacterComposer {
  // 核心方法：合成角色精灵表
  async composeCharacter(
    selections: Record<string, PartSelection>,
    options: ComposeOptions
  ): Promise<ComposeResult>;

  // 提取单个动画
  extractAnimation(canvas: HTMLCanvasElement, animation: string): HTMLCanvasElement;

  // 生成 Phaser 精灵帧数据
  generateFrameConfig(): Phaser.Types.Animations.Animation;
}
```

#### 3.2 PartRegistry（部位注册表）
```typescript
interface PartMetadata {
  itemId: string;
  name: string;
  typeName: string;          // 分类：body, hair, weapon...
  required: string[];        // 支持的 bodyType
  animations: string[];      // 支持的动画
  variants: string[];        // 颜色变体
  layers: {
    [layerNum: number]: {
      zPos: number;
      paths: Record<string, string>;  // bodyType -> path
    };
  };
  credits: CreditInfo[];
}

class PartRegistry {
  // 获取所有可用部位（按分类）
  getPartsByCategory(category: string): PartMetadata[];

  // 获取部位元数据
  getPartMetadata(itemId: string): PartMetadata | null;

  // 构建精灵路径
  buildSpritePath(
    itemId: string,
    variant: string,
    bodyType: string,
    animation: string,
    layerNum: number
  ): string | null;

  // 加载元数据（从 item-metadata.json）
  async loadMetadata(): Promise<void>;
}
```

#### 3.3 CharacterStorage（存储层）
```typescript
interface SavedCharacter {
  characterId: string;
  name: string;
  bodyType: string;
  parts: Record<string, PartSelection>;
  skillTree: {
    selectedNodes: string[];
    unlockedNodes: string[];
  };
  attributes: Record<string, number>;
  isDefault: boolean;
  thumbnail?: string;  // Base64 缩略图
  createdAt: number;
  updatedAt: number;
}

class CharacterStorage {
  // CRUD 操作
  async save(character: SavedCharacter): Promise<void>;
  async load(characterId: string): Promise<SavedCharacter | null>;
  async list(): Promise<SavedCharacter[]>;
  async delete(characterId: string): Promise<void>;

  // 导出/导入
  async export(characterId: string): Promise<string>;  // JSON
  async import(jsonData: string): Promise<SavedCharacter>;
}
```

### 4. 数据结构

#### 4.1 角色配置数据
```json
{
  "characterId": "char_abc123",
  "name": "星际战士 Alpha",
  "bodyType": "male",
  "parts": {
    "shadow": { "itemId": "shadow_default", "variant": "normal" },
    "body": { "itemId": "body_male", "variant": "light" },
    "hair": { "itemId": "hair_long", "variant": "black" },
    "torso": { "itemId": "torso_armour", "variant": "steel" },
    "legs": { "itemId": "legs_pants", "variant": "black" },
    "feet": { "itemId": "feet_boots", "variant": "brown" }
  },
  "skillTree": {
    "selectedNodes": ["skill_attack_01", "skill_defense_02"],
    "unlockedNodes": ["skill_attack_01", "skill_defense_01", "skill_defense_02"]
  },
  "attributes": {
    "attack": 15,
    "defense": 12,
    "speed": 8
  },
  "isDefault": true,
  "createdAt": 1740000000000,
  "updatedAt": 1740000100000
}
```

#### 4.2 部位元数据示例
```json
{
  "torso_armour": {
    "name": "Plate Armour",
    "typeName": "torso",
    "required": ["male", "female", "teen", "muscular", "pregnant"],
    "animations": ["spellcast", "thrust", "walk", "slash", "shoot", "hurt", "idle"],
    "variants": ["steel", "iron", "gold", "bronze"],
    "layers": {
      "layer_1": {
        "zPos": 60,
        "male": "torso/armour/plate/male/",
        "female": "torso/armour/plate/female/",
        "teen": "torso/armour/plate/female/",
        "muscular": "torso/armour/plate/male/",
        "pregnant": "torso/armour/plate/female/"
      }
    },
    "credits": [
      {
        "authors": ["Johannes Sjölund (wulax)"],
        "licenses": ["OGA-BY 3.0", "CC-BY-SA 3.0"]
      }
    ]
  }
}
```

### 5. 跨模块事件协议

| 事件名称 | 方向 | 数据结构 | 说明 |
|----------|------|----------|------|
| `character:open` | RTS → Creator | `{ targetId?: string }` | 打开角色生成器，可选指定编辑目标 |
| `character:created` | Creator → RTS | `SavedCharacter` | 角色创建完成 |
| `character:updated` | Creator → RTS | `SavedCharacter` | 角色更新完成 |
| `character:deleted` | Creator → RTS | `{ characterId: string }` | 角色删除通知 |
| `character:selected` | Creator → RTS | `SavedCharacter` | 选择角色用于游戏 |

## 开发步骤

### Phase 1: 基础架构（1 周）
- [x] 1.1 创建模块目录结构
- [x] 1.2 实现 PartRegistry 元数据加载
- [x] 1.3 实现 CharacterStorage IndexedDB 封装
- [x] 1.4 创建 CharacterCreatorScene Phaser 场景骨架

### Phase 2: 精灵合成核心（1.5 周）
- [x] 2.1 实现 CharacterComposer.composeCharacter()
- [x] 2.2 实现层级排序与并行图片加载
- [x] 2.3 实现 Canvas 合成与动画提取
- [x] 2.4 集成 Phaser 精灵表生成

### Phase 3: UI 交互层（1 周）
- [x] 3.1 实现部位选择 UI（分类列表 + 变体选择）
- [x] 3.2 实现角色预览组件（动画播放 + 缩放）
- [x] 3.3 实现随机生成按钮逻辑
- [x] 3.4 实现角色列表管理 UI

### Phase 4: 技能树与集成（0.5 周）
- [x] 4.1 实现技能树数据结构与规则校验
- [x] 4.2 实现技能树 UI 组件
- [x] 4.3 对接 StratixEventBus 跨模块通信
- [x] 4.4 性能优化与测试

## 测试用例

| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 随机生成角色 | 点击「随机生成」按钮 | 正确合成精灵，预览显示动画 |
| TC-002 | 部位切换 | 点击「头部」分类，选择「长发-黑色」 | 预览实时更新为新发型 |
| TC-003 | Body Type 切换 | 从 male 切换到 female | 身体及相关部位正确切换 |
| TC-004 | 保存角色 | 填写名称，点击保存 | IndexedDB 存储成功，列表显示新角色 |
| TC-005 | 加载已保存角色 | 点击角色列表中的角色 | 进入编辑模式，显示正确配置 |
| TC-006 | 技能树选择 | 点击技能节点 | 属性面板实时更新，规则校验正确 |
| TC-007 | 动画预览切换 | 选择不同动画类型 | 预览区播放对应动画 |
| TC-008 | 导出角色 | 点击导出按钮 | 生成可导入的 JSON 文件 |
| TC-009 | 性能测试 | 连续随机生成 50 次 | 帧率 ≥ 30fps，无内存泄漏 |
| TC-010 | 跨模块通信 | 保存角色后返回 RTS | RTS 模块收到 character:created 事件 |

## 验收标准

### 功能验收
- [ ] 支持所有 22+ 部位分类的选择与合成
- [ ] 支持 male/female/teen/muscular/pregnant 五种体型
- [ ] 支持 15+ 动画类型预览
- [ ] 随机生成、部位自定义、技能树交互功能完整
- [ ] 角色保存/加载/删除/导出功能正常

### 性能验收
- [ ] 模块初始化时间 ≤ 1s（首屏部位资源 ≤ 5MB）
- [ ] 精灵合成时间 ≤ 200ms（单角色全动画）
- [ ] 预览渲染帧率 ≥ 60fps
- [ ] IndexedDB 读写 ≤ 200ms

### 代码质量
- [ ] TypeScript 类型覆盖 100%
- [ ] 核心函数注释完整
- [ ] 遵循项目 ESLint 规则
- [ ] 无 console 残留（DEBUG 模式除外）

## 变更记录

| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建，完成技术架构设计 | AI Assistant |
| 2026-02-22 | Phase 1 & 2 完成：基础架构 + 精灵合成核心 | AI Assistant |
| 2026-02-22 | Phase 3 完成：UI 交互层（部位选择/预览/列表） | AI Assistant |
| 2026-02-22 | Phase 4 完成：技能树 + EventBus 集成，模块开发完成 | AI Assistant |
