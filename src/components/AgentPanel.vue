<script setup lang="ts">
import { StratixAgentConfig } from '../stratix-core';

const props = defineProps<{
  agents: StratixAgentConfig[];
  selectedIds: string[];
}>();

const emit = defineEmits<{
  (e: 'create', type: 'writer' | 'dev' | 'analyst'): void;
  (e: 'delete', agentId: string): void;
  (e: 'select', agentId: string): void;
  (e: 'open-character-creator'): void;
}>();

const heroTypes = [
  { type: 'writer' as const, name: '文案英雄', color: '#00ff88', icon: '✍' },
  { type: 'dev' as const, name: '开发英雄', color: '#00d4ff', icon: '💻' },
  { type: 'analyst' as const, name: '数据英雄', color: '#ff6b9d', icon: '📊' }
];

const getHeroTypeColor = (type: string) => {
  return heroTypes.find(h => h.type === type)?.color || '#888';
};

const getHeroTypeIcon = (type: string) => {
  return heroTypes.find(h => h.type === type)?.icon || '⭐';
};

const isSelected = (agentId: string) => props.selectedIds.includes(agentId);
</script>

<template>
  <div class="agent-panel">
    <div class="panel-header">
      <h3>英雄列表</h3>
      <div class="header-actions">
        <button 
          class="custom-char-btn" 
          @click="emit('open-character-creator')"
          title="自定义角色"
        >
          🎭
        </button>
        <el-dropdown @command="emit('create', $event)" trigger="click">
          <el-button type="primary" size="small">
            + 新建
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="hero in heroTypes" 
                :key="hero.type"
                :command="hero.type"
              >
                {{ hero.icon }} {{ hero.name }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="emit('open-character-creator')">
                🎭 自定义角色
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="agent-list">
      <div 
        v-for="agent in agents" 
        :key="agent.agentId"
        class="agent-card"
        :class="{ selected: isSelected(agent.agentId) }"
        @click="emit('select', agent.agentId)"
      >
        <div class="agent-icon" :style="{ color: getHeroTypeColor(agent.type) }">
          {{ getHeroTypeIcon(agent.type) }}
        </div>
        <div class="agent-info">
          <div class="agent-name">{{ agent.name }}</div>
          <div class="agent-skills">{{ agent.skills.length }} 技能</div>
        </div>
        <button 
          class="delete-btn"
          @click.stop="emit('delete', agent.agentId)"
          title="删除"
        >×</button>
      </div>
      
      <div v-if="agents.length === 0" class="empty-state">
        <div class="empty-icon">🎭</div>
        <div class="empty-title">还没有英雄</div>
        <div class="empty-desc">点击上方按钮创建你的第一个英雄</div>
        <div class="empty-actions">
          <el-dropdown @command="emit('create', $event)" trigger="click">
            <el-button type="primary" size="small">
              + 创建英雄
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-for="hero in heroTypes" 
                  :key="hero.type"
                  :command="hero.type"
                >
                  {{ hero.icon }} {{ hero.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="emit('open-character-creator')">
            🎭 自定义
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  color: #fff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-char-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
  color: #00d4ff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-char-btn:hover {
  background: linear-gradient(135deg, #3a3a5e 0%, #2a2a3e 100%);
  transform: scale(1.1);
}

.agent-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.agent-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.agent-card:hover {
  background: rgba(255, 255, 255, 0.1);
}

.agent-card.selected {
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.agent-icon {
  font-size: 24px;
  margin-right: 12px;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-skills {
  font-size: 12px;
  color: #666;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
}

.agent-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  line-height: 1.8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 16px;
  color: #888;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: #555;
  margin-bottom: 20px;
}

.empty-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
