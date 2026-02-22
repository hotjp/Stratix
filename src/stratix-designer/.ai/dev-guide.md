# Stratix Designer 模块开发指南

> 本文档记录 stratix-designer 模块的开发经验，供后续 AI 会话参考，确保开发风格一致性。

## 1. 模块概述

### 1.1 职责边界
- **负责**: Agent 可视化配置、模板管理、配置标准化转换、配置校验
- **不负责**: 配置下发、OpenClaw 对接、指令执行（由中间件处理）

### 1.2 核心依赖
```
stratix-core/
├── stratix-protocol.ts    # 数据类型定义
└── StratixEventBus.ts     # 事件总线
```

### 1.3 文件结构
```
src/stratix-designer/
├── init.md                      # 模块需求文档（只读）
├── StratixHeroDesigner.ts       # 核心逻辑类
├── index.ts                     # 模块统一导出
├── components/
│   ├── SoulEditor.vue           # Soul 编辑器
│   ├── SkillEditor.vue          # 技能编辑器
│   ├── MemoryEditor.vue         # 记忆编辑器
│   ├── ModelConfig.vue          # 模型配置
│   ├── HeroForm.vue             # 主表单组件
│   └── index.ts
├── templates/
│   ├── types.ts                 # 模板接口定义
│   ├── WriterHeroTemplate.ts    # 文案英雄模板
│   ├── DevHeroTemplate.ts       # 开发英雄模板
│   ├── AnalystHeroTemplate.ts   # 分析英雄模板
│   └── index.ts
├── utils/
│   ├── ConfigValidator.ts       # 配置校验
│   ├── ConfigConverter.ts       # 格式转换
│   └── index.ts
├── styles/
│   └── design-tokens.ts         # 设计变量
└── .long-run-agent/             # LRA 工具目录
    ├── config.json
    ├── feature_list.json
    ├── specs/                   # Feature 需求文档
    │   └── feature_*.md
    └── records/
```

---

## 2. LRA 工具使用

### 2.1 初始化项目
```bash
# 在模块目录下执行
lra project create --name stratix-designer
```

### 2.2 创建 Feature
```bash
lra feature create "Feature名称" --category 类别 --priority P0
```
- category: `core` | `utils` | `templates` | `components`
- priority: `P0` (核心) | `P1` (重要) | `P2` (一般)

### 2.3 创建需求文档
```bash
lra spec create feature_001 --title "Feature标题"
```

### 2.4 更新状态流程
```bash
# pending -> in_progress -> pending_test -> completed
lra feature status feature_001 --set in_progress
lra feature status feature_001 --set pending_test
lra feature status feature_001 --set completed
```

### 2.5 查看状态
```bash
lra feature list    # Feature 列表
lra stats           # 统计信息
lra spec list       # 需求文档列表
```

---

## 3. Feature 开发流程

### 3.1 标准流程
```
1. 阅读需求 → 2. 创建 Feature → 3. 编写 Spec → 4. 开发代码 
    → 5. 类型检查 → 6. 提交代码 → 7. 更新状态 → 8. 推送
```

### 3.2 需求文档模板 (feature_*.md)
```markdown
# Feature feature_xxx - 标题

## 元信息
- **优先级**: P0/P1/P2
- **负责人**: AI Agent
- **预计工时**: x 天
- **创建时间**: YYYY-MM-DD

## 功能描述
<!-- 100字以内描述功能目标和场景 -->

## 功能设计方案
<!-- 接口设计、数据流向、核心逻辑 -->

## 开发步骤
- [ ] 步骤 1
- [ ] 步骤 2

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | ... | ... | ... |

## 验收标准
- [ ] 标准 1
- [ ] 标准 2

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| YYYY-MM-DD | 初始创建 | AI |
```

### 3.3 开发顺序建议
1. **utils/** - 基础工具类（无依赖）
2. **templates/** - 数据模板（依赖 protocol）
3. **核心类** - 业务逻辑（依赖 utils + templates）
4. **components/** - Vue 组件（依赖核心类）
5. **index.ts** - 统一导出

---

## 4. 代码规范

### 4.1 TypeScript 规范
```typescript
// 使用 @/ 路径别名导入
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

// 接口命名: I + 名词 (可选) 或直接名词
interface ValidationResult { ... }

// 类命名: PascalCase
export class ConfigValidator { ... }

// 方法命名: camelCase，动词开头
public validateConfig() { ... }
private buildSystemPrompt() { ... }

// 常量: UPPER_SNAKE_CASE 或 camelCase (私有)
private static readonly TYPE = 'writer';

// 类型参数: 单字母或描述性名称
export type HeroType = 'writer' | 'dev' | 'analyst';
```

### 4.2 Vue 组件规范
```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed, onMounted } from 'vue';
import type { StratixSoulConfig } from '@/stratix-core/stratix-protocol';

// 2. Props/Emits
const props = defineProps<{
  modelValue: StratixSoulConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixSoulConfig): void;
}>();

// 3. 响应式状态
const loading = ref(false);

// 4. 计算属性
const identity = computed({
  get: () => props.modelValue.identity,
  set: (value) => emit('update:modelValue', { ...props.modelValue, identity: value }),
});

// 5. 方法
const handleSubmit = () => { ... };

// 6. 生命周期
onMounted(() => { ... });
</script>

<template>
  <!-- HTML -->
</template>

<style scoped>
/* CSS */
</style>
```

### 4.3 导出规范
```typescript
// index.ts 统一导出
export { StratixHeroDesigner, HeroDesignerOptions } from './StratixHeroDesigner';
export { ConfigValidator, ConfigConverter } from './utils';
export type { ValidationResult } from './utils';
export * from './components';
```

---

## 5. 设计系统 (UI UX Pro Max)

### 5.1 颜色变量
```css
/* 背景 */
--bg-primary: #020617;      /* 页面背景 */
--bg-secondary: #0F172A;    /* 卡片背景 */
--bg-tertiary: #1E293B;     /* hover 背景 */

/* 边框 */
--border-primary: #1E293B;
--border-secondary: #334155;
--border-focus: #22C55E;

/* 文字 */
--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--text-muted: #64748B;

/* 强调色 */
--accent-primary: #22C55E;  /* 主强调（绿） */
--accent-secondary: #4A90E2; /* 次强调（蓝） */
--accent-warning: #E67E22;   /* 警告（橙） */
--accent-danger: #EF4444;    /* 危险（红） */

/* 英雄类型色 */
--hero-writer: #4A90E2;
--hero-dev: #9B59B6;
--hero-analyst: #E67E22;
```

### 5.2 字体
```css
--font-sans: 'Fira Sans', sans-serif;     /* 正文 */
--font-mono: 'Fira Code', monospace;      /* 代码/ID */
```

### 5.3 间距与圆角
```css
/* 圆角 */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* 间距 */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
```

### 5.4 通用组件样式
```css
/* 输入框 */
.input-field {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 10px 14px;
}
.input-field:focus {
  border-color: #22C55E;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

/* 按钮 - 主要 */
.btn-primary {
  background: #22C55E;
  color: #020617;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
}

/* 按钮 - 次要 */
.btn-secondary {
  background: transparent;
  color: #F8FAFC;
  border: 1px solid #1E293B;
  padding: 8px 16px;
  border-radius: 8px;
}

/* 卡片 */
.card {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 16px;
}
```

### 5.5 动画
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 无障碍: 尊重 reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 6. Git 提交规范

### 6.1 Commit 格式
```
<type>(<scope>): <subject>

[optional body]
```

### 6.2 Type 类型
| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不增加功能、不修复Bug） |
| `style` | 样式调整 |
| `docs` | 文档更新 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 6.3 Scope
- `designer` - 本模块
- `core` - 核心模块
- `data-store` - 数据存储

### 6.4 示例
```bash
feat(designer): add ConfigValidator and ConfigConverter utilities
fix(designer): validate agentId prefix correctly
refactor(designer): redesign components with UI UX Pro Max style
docs(designer): update README with API examples
```

---

## 7. 常见问题

### 7.1 类型检查报错: Cannot find module '@/xxx'
- 确保 tsconfig.json 中配置了 paths
- 使用 `@/` 而非相对路径

### 7.2 Vue 组件类型报错
- 添加 `vue-shim.d.ts` 声明文件
- 确保安装了 `@vitejs/plugin-vue`

### 7.3 DOM 类型报错
- tsconfig.json lib 中添加 `"DOM"`

### 7.4 浏览器 API 不可用
- 使用 `globalThis` 代替 `window`/`document`
- 添加环境检查: `if (typeof globalThis !== 'undefined')`

---

## 8. 快速启动清单

新会话开始时，按以下步骤快速恢复上下文：

```bash
# 1. 确认工作目录
pwd  # 应该在 /Users/kingj/code/Stratix

# 2. 查看 Feature 状态
cd src/stratix-designer && lra feature list

# 3. 阅读模块需求
cat init.md

# 4. 查看待开发 Feature
cat .long-run-agent/specs/feature_xxx.md

# 5. 检查代码状态
git status
```

---

## 9. 联系与反馈

- **模块负责人**: stratix-team
- **文档维护**: AI Agent
- **问题反馈**: 通过 LRA 工具记录或提交 Issue

---

**最后更新**: 2026-02-22  
**文档版本**: v1.0.0
