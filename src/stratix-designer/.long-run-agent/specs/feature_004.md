# Feature feature_004 - Vue 编辑器组件

## 元信息
- **优先级**: P1（前端组件）
- **负责人**: AI Agent
- **预计工时**: 3 天
- **创建时间**: 2026-02-22 15:46:26

## 功能描述
四个 Vue 3 编辑器组件，用于可视化编辑 Agent 配置的各个部分：Soul、技能、记忆和模型参数。

## 功能设计方案

### SoulEditor.vue
- 身份描述 textarea
- 目标列表（动态添加/删除）
- 性格描述 textarea

### SkillEditor.vue
- 技能列表折叠面板
- 每个技能：ID、名称、描述
- 参数配置：ID、名称、类型、必填、默认值
- 执行脚本 JSON 编辑

### MemoryEditor.vue
- 短期记忆 Tag 列表
- 长期记忆 Tag 列表
- 上下文 textarea

### ModelConfig.vue
- 模型选择下拉框（Claude/GPT 系列）
- Temperature 滑块 + 数字输入
- Top P 滑块 + 数字输入
- 最大 Tokens 数字输入

### 技术栈
- Vue 3 Composition API
- Element Plus UI 组件
- TypeScript

### 文件结构
```
components/
├── SoulEditor.vue
├── SkillEditor.vue
├── MemoryEditor.vue
├── ModelConfig.vue
├── vue-shim.d.ts
└── index.ts
```

## 开发步骤
- [x] 步骤 1：创建 SoulEditor.vue
- [x] 步骤 2：创建 SkillEditor.vue
- [x] 步骤 3：创建 MemoryEditor.vue
- [x] 步骤 4：创建 ModelConfig.vue
- [x] 步骤 5：安装 Vue 3 + Element Plus 依赖
- [x] 步骤 6：添加 TypeScript 类型支持

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | Soul 编辑 | 修改身份/目标/性格 | emit update:modelValue |
| TC-002 | 技能添加 | 点击添加技能按钮 | 新增空技能 |
| TC-003 | 参数配置 | 添加/修改/删除参数 | 正确更新 |
| TC-004 | 记忆管理 | 添加/删除记忆项 | Tag 列表更新 |
| TC-005 | 模型选择 | 切换模型 | model.name 更新 |
| TC-006 | 参数滑块 | 拖动 temperature | 值正确更新 |

## 验收标准
- [x] 标准 1：所有组件正确渲染
- [x] 标准 2：v-model 双向绑定工作正常
- [x] 标准 3：Element Plus 组件正确集成
- [x] 标准 4：TypeScript 类型检查通过

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | AI |
| 2026-02-22 | 开发完成 | AI |
