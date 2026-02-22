# Feature 001: 技能列表展示

## 功能概述
展示当前选中 Agent（英雄）可执行的所有技能列表，支持技能选择和技能信息展示。

## 功能需求

### 1. 技能加载
- **触发条件**：接收 RTS 界面发射的 `stratix:agent_select` 事件
- **数据来源**：通过 API 获取 Agent 的技能配置
  ```
  GET /api/stratix/config/agent/get?agentId=xxx
  ```
- **数据结构**：`StratixAgentConfig` 中的 `skills` 数组

### 2. UI 展示
- **布局位置**：指令面板的左侧区域
- **展示内容**：
  - 技能名称（name）
  - 技能描述（description）
  - 技能图标（可选）
- **交互方式**：
  - 点击技能高亮选中
  - 选中的技能显示详细参数表单
  - 支持技能搜索/筛选（可选）

### 3. 多 Agent 选择处理
- **场景**：当用户框选多个 Agent 时
- **处理逻辑**：
  - 取交集：仅展示所有选中 Agent 共有的技能
  - 或提示：用户确认是否对所有 Agent 执行同一指令
  - 或单独：每个 Agent 显示各自的技能列表（标签页切换）

### 4. 视觉设计
- **技能卡片样式**：
  - 默认状态：白色背景，黑色文字
  - 悬停状态：浅灰色背景
  - 选中状态：绿色边框（符合 Stratix 选中色规范）
- **技能分类**：
  - 文案类技能：蓝色图标
  - 开发类技能：紫色图标
  - 数据分析类技能：橙色图标

## 技术实现

### 文件结构
```
src/stratix-command-panel/
├── components/
│   └── SkillList.vue          # 技能列表组件
```

### 核心代码（SkillList.vue）
```vue
<template>
  <div class="skill-list">
    <div class="skill-search" v-if="skills.length > 5">
      <input 
        v-model="searchQuery" 
        placeholder="搜索技能..."
        class="search-input"
      />
    </div>
    
    <div class="skills-container">
      <div 
        v-for="skill in filteredSkills"
        :key="skill.skillId"
        :class="['skill-card', { selected: selectedSkillId === skill.skillId }]"
        @click="selectSkill(skill)"
      >
        <div class="skill-icon" :style="{ backgroundColor: getSkillColor(skill) }">
          {{ skill.name.charAt(0) }}
        </div>
        <div class="skill-info">
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-desc">{{ skill.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { StratixSkillConfig } from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import axios from 'axios';

const skills = ref<StratixSkillConfig[]>([]);
const selectedSkillId = ref<string>('');
const searchQuery = ref<string>('');

const filteredSkills = computed(() => {
  if (!searchQuery.value) return skills.value;
  return skills.value.filter(skill => 
    skill.name.includes(searchQuery.value) ||
    skill.description.includes(searchQuery.value)
  );
});

const selectSkill = (skill: StratixSkillConfig) => {
  selectedSkillId.value = skill.skillId;
  emit('skill-selected', skill);
};

const getSkillColor = (skill: StratixSkillConfig): string => {
  const colors: Record<string, string> = {
    writer: '#4A90E2',
    dev: '#9B59B6',
    analyst: '#E67E22'
  };
  return colors[skill.skillId.split('-')[2]] || '#95A5A6';
};

const loadAgentSkills = async (agentIds: string[]) => {
  try {
    const response = await axios.get('/api/stratix/config/agent/get', {
      params: { agentId: agentIds[0] }
    });
    skills.value = response.data.data.skills;
  } catch (error) {
    console.error('加载技能失败:', error);
  }
};

onMounted(() => {
  StratixEventBus.subscribe('stratix:agent_select', (event) => {
    const agentIds = event.payload.agentIds || [];
    loadAgentSkills(agentIds);
  });
});

const emit = defineEmits<{
  (e: 'skill-selected', skill: StratixSkillConfig): void;
}>();
</script>

<style scoped>
.skill-list {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}

.skill-search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.skill-card {
  display: flex;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-card:hover {
  background: #f5f5f5;
}

.skill-card.selected {
  border-color: #00ff00;
  background: #f0fff0;
}

.skill-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 12px;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.skill-desc {
  font-size: 12px;
  color: #666;
}
</style>
```

## 测试用例

### 1. 单个 Agent 选择测试
- **输入**：选中 1 个 Agent（文案英雄）
- **预期**：展示该 Agent 的所有技能（快速写文案、文案优化）

### 2. 多个 Agent 选择测试
- **输入**：选中 2 个 Agent（文案英雄 + 开发英雄）
- **预期**：
  - 方案 1：仅展示共有技能（如果有）
  - 方案 2：提示用户确认
  - 方案 3：切换标签页

### 3. 技能搜索测试
- **输入**：在搜索框输入"文案"
- **预期**：仅展示名称或描述包含"文案"的技能

### 4. 技能选择测试
- **输入**：点击技能卡片
- **预期**：
  - 卡片高亮（绿色边框）
  - 触发 `skill-selected` 事件
  - 右侧展示参数表单

## 验收标准
- [ ] 正确加载并展示 Agent 技能列表
- [ ] 支持技能搜索/筛选
- [ ] 点击技能触发选中事件
- [ ] 多 Agent 选择场景处理合理
- [ ] UI 样式符合 Stratix 设计规范

## 依赖
- `stratix-protocol.ts`：数据类型定义
- `StratixEventBus`：事件总线
- Vue 3：前端框架
- Element Plus / Ant Design：UI 组件（可选）

## 预估工时
- **开发时间**：2 天
- **测试时间**：1 天
- **总计**：3 天

## 备注
- 技能图标可使用首字母或预设图标
- 技能列表支持虚拟滚动优化（技能数量超过 50 时）
- 支持技能收藏功能（可选）
