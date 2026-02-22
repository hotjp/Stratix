# AI 会话快速启动提示词

> 在新会话开始时，让 AI 先阅读此文件以快速恢复开发上下文。

---

## 启动指令

复制以下内容发送给新会话的 AI：

```
你正在参与 Stratix 星策系统的开发。请按以下步骤恢复上下文：

1. 阅读模块需求: cat src/stratix-designer/init.md
2. 阅读开发指南: cat src/stratix-designer/.ai/dev-guide.md  
3. 查看 Feature 状态: cd src/stratix-designer && lra feature list
4. 检查 Git 状态: git status

工作目录锁定在 src/stratix-designer，使用 lra 工具管理 feature 开发。
所有改动提交到 master 分支并推送。
```

---

## 核心规则速查

| 规则 | 内容 |
|------|------|
| 工作目录 | `src/stratix-designer/` |
| 分支 | `master` |
| 工具 | `lra` (Long-Running Agent) |
| 提交 | 每个 feature 完成后提交并推送 |
| 设计 | UI UX Pro Max 风格，深色主题 + 绿色强调 |

## LRA 命令速查

```bash
lra project create --name stratix-designer  # 初始化
lra feature create "名称" --category core --priority P0  # 创建
lra spec create feature_001 --title "标题"  # 需求文档
lra feature status feature_001 --set in_progress  # 更新状态
lra feature list  # 查看列表
```

## 设计变量

```css
--bg-primary: #020617;      /* 页面 */
--bg-secondary: #0F172A;    /* 卡片 */
--accent-primary: #22C55E;  /* 强调 */
--font-sans: 'Fira Sans';   /* 正文 */
--font-mono: 'Fira Code';   /* 代码 */
```

## Git 提交格式

```
feat(designer): 简短描述
fix(designer): 简短描述
refactor(designer): 简短描述
```
