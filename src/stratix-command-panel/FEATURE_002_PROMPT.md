# Stratix Command Panel - Feature 002: 参数表单编辑

## 项目背景
你是 Stratix 星策系统的 AI 开发助手，当前正在开发 **stratix-command-panel** 模块。

### 项目信息
- **项目根路径**: `/Users/kingj/code/Stratix`
- **模块工作路径**: `/Users/kingj/code/Stratix/src/stratix-command-panel`
- **当前分支**: `master`
- **工作模式**: 在 master 分支直接开发，改动完成后立即提交并推送

### 已完成
✅ Feature 001: 技能列表展示（已完成）
  - SkillList.vue 组件已实现
  - 事件总线集成完成
  - 设计系统：Data-Dense Dashboard 风格

### 当前任务
开始开发 **Feature 002: 参数表单编辑**

## 开发要求

### 1. 阅读文档
首先阅读以下文档：
- `.long-run-agent/specs/feature_002.md` - Feature 002 详细需求
- `.opencode/skills/ui-ux-pro-max/SKILL.md` - UI/UX Pro Max skill 使用指南
- `src/stratix-core/stratix-protocol.ts` - 数据协议定义

### 2. 设置 Feature 状态
```bash
cd /Users/kingj/code/Stratix/src/stratix-command-panel
lra feature status feature_002 --set in_progress
```

### 3. 生成设计系统
使用 UI/UX Pro Max skill 为参数表单生成设计系统：
```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "form input validation dashboard" --design-system -p "Stratix ParamForm" -f markdown
```

### 4. 开发步骤（按顺序执行）
参考 `.long-run-agent/specs/feature_002.md` 中的开发步骤：

1. 创建 ParamForm.vue 组件基础结构
2. 实现动态表单生成逻辑（根据参数类型渲染不同组件）
3. 创建 ParamValidator.ts 校验工具类
4. 实现实时校验逻辑（blur/focus 事件）
5. 实现参数重置功能
6. 实现表单提交逻辑（校验通过后发射 submit 事件）
7. 编写样式（符合 Stratix 设计规范）
8. 编写单元测试（可选）

### 5. 核心功能要求

#### 参数类型映射
- `string` → 文本输入框（Input/Textarea）
- `number` → 数字输入框（InputNumber）
- `boolean` → 开关（Switch/Checkbox）
- `enum` → 下拉选择

#### 校验规则
- 必填校验：`required: true` 的参数不能为空
- 类型校验：`number` 类型需符合 min/max 范围
- 实时反馈：输入时实时校验，显示错误提示
- 错误提示样式：红色边框 + 红色错误文本

#### 视觉设计
遵循 Feature 001 的设计系统：
- 深色主题：背景 `#020617`，强调色 `#22C55E`
- 字体：Fira Code（标题）+ Fira Sans（正文）
- 输入框：白色背景 `#0F172A`，灰色边框 `#1E293B`
- 聚焦状态：蓝色边框
- 错误状态：红色边框 + 错误提示

#### 事件集成
- 接收事件：`stratix:skill_selected`（来自 SkillList）
- 发射事件：`stratix:param_submit`（传递参数对象）

### 6. 技术栈
- Vue 3 Composition API
- TypeScript（严格模式）
- StratixEventBus（事件总线）
- axios（API 调用）

### 7. 质量要求
- ✅ TypeScript 类型检查通过（`npm run typecheck`）
- ✅ 代码符合 ESLint 规范（`npm run lint`）
- ✅ 支持键盘导航和无障碍访问
- ✅ 响应式设计（375px - 1440px）
- ✅ 尊重 `prefers-reduced-motion` 设置

### 8. 提交规范
完成开发后，提交代码并推送到远程仓库：
```bash
git add src/stratix-command-panel/
git commit -m "feat(command-panel): 实现 Feature 002 - 参数表单编辑组件

✅ 完成开发步骤：
- 创建 ParamForm.vue 组件
- 实现 ParamValidator.ts 校验工具
- 实现动态表单生成
- 实现实时校验反馈
- 实现参数重置功能
- 编写样式（符合设计规范）

📝 技术实现：
- Vue 3 Composition API
- TypeScript 严格类型检查
- 多种参数类型支持
- 实时校验机制"

git push origin master
```

### 9. 更新 Feature 状态
```bash
cd /Users/kingj/code/Stratix/src/stratix-command-panel
lra feature status feature_002 --set pending_test
lra feature status feature_002 --set completed
```

### 10. 注意事项
- ⚠️ 仅修改 `src/stratix-command-panel/` 目录下的文件
- ⚠️ 不要修改其他模块的代码
- ⚠️ 保持与 Feature 001 的设计一致性
- ⚠️ 使用 SVG 图标，不要使用 emoji
- ⚠️ 所有交互元素必须添加 `cursor-pointer`
- ⚠️ 遵循 UI/UX Pro Max skill 的 Pre-Delivery Checklist

## 开发流程
1. 阅读文档
2. 设置 Feature 状态
3. 生成设计系统
4. 按步骤开发
5. 测试验证
6. 提交代码
7. 推送到远程仓库
8. 更新 Feature 状态
9. 完成，重启新会话开发 Feature 003

开始开发吧！🚀
