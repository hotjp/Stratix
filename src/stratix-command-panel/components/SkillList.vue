<template>
  <div class="skill-list">
    <div class="skill-header">
      <h3 class="skill-title">技能列表</h3>
      <div v-if="selectedAgentCount > 0" class="agent-count">
        {{ selectedAgentCount }} 个 Agent 已选中
      </div>
    </div>

    <div v-if="skills.length > 5" class="skill-search">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
      </svg>
      <input
        v-model="searchQuery"
        placeholder="搜索技能..."
        class="search-input"
        type="text"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载技能中...</p>
    </div>

    <div v-else-if="filteredSkills.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p>{{ searchQuery ? '未找到匹配的技能' : '暂无可用技能' }}</p>
    </div>

    <div v-else class="skills-container">
      <div
        v-for="skill in filteredSkills"
        :key="skill.skillId"
        :class="['skill-card', { selected: selectedSkillId === skill.skillId }]"
        @click="selectSkill(skill)"
        tabindex="0"
        @keydown.enter="selectSkill(skill)"
        @keydown.space.prevent="selectSkill(skill)"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { StratixSkillConfig, StratixFrontendOperationEvent } from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import axios from 'axios';

const skills = ref<StratixSkillConfig[]>([]);
const selectedSkillId = ref<string>('');
const searchQuery = ref<string>('');
const selectedAgentIds = ref<string[]>([]);
const loading = ref<boolean>(false);

const selectedAgentCount = computed(() => selectedAgentIds.value.length);

const filteredSkills = computed(() => {
  if (!searchQuery.value) return skills.value;
  const query = searchQuery.value.toLowerCase();
  return skills.value.filter(skill =>
    skill.name.toLowerCase().includes(query) ||
    skill.description.toLowerCase().includes(query)
  );
});

const selectSkill = (skill: StratixSkillConfig) => {
  selectedSkillId.value = skill.skillId;
  const event: StratixFrontendOperationEvent = {
    eventType: 'stratix:skill_selected',
    payload: {
      agentIds: selectedAgentIds.value,
      skill
    },
    timestamp: Date.now(),
    requestId: `stratix-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  };
  StratixEventBus.emit(event);
};

const getSkillColor = (skill: StratixSkillConfig): string => {
  const skillType = skill.skillId.split('-')[2];
  const colors: Record<string, string> = {
    writer: '#4A90E2',
    dev: '#9B59B6',
    analyst: '#E67E22',
    default: '#64748B'
  };
  return colors[skillType] || colors.default;
};

const loadAgentSkills = async (agentIds: string[]) => {
  if (agentIds.length === 0) {
    skills.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await axios.get('/api/stratix/config/agent/get', {
      params: { agentId: agentIds[0] }
    });
    skills.value = response.data.data.skills || [];
  } catch (error) {
    console.error('加载技能失败:', error);
    skills.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAgentSelect = (event: StratixFrontendOperationEvent) => {
  selectedAgentIds.value = event.payload.agentIds || [];
  selectedSkillId.value = '';
  loadAgentSkills(selectedAgentIds.value);
};

onMounted(() => {
  StratixEventBus.subscribe('stratix:agent_select', handleAgentSelect);
});

onUnmounted(() => {
  StratixEventBus.unsubscribe('stratix:agent_select', handleAgentSelect);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

.skill-list {
  font-family: 'Fira Sans', sans-serif;
  background: #020617;
  border-radius: 12px;
  padding: 16px;
  color: #F8FAFC;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1E293B;
}

.skill-title {
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #F8FAFC;
}

.agent-count {
  font-size: 12px;
  color: #22C55E;
  background: rgba(34, 197, 94, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.skill-search {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #64748B;
  stroke-width: 2;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  color: #F8FAFC;
  font-size: 14px;
  transition: border-color 200ms ease;
}

.search-input::placeholder {
  color: #64748B;
}

.search-input:focus {
  outline: none;
  border-color: #22C55E;
}

.skills-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.skill-card {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
}

.skill-card:hover {
  background: #1E293B;
  border-color: #334155;
  transform: translateX(4px);
}

.skill-card.selected {
  border-color: #22C55E;
  background: rgba(34, 197, 94, 0.1);
  box-shadow: 0 0 0 1px #22C55E;
}

.skill-card:focus {
  outline: none;
  border-color: #22C55E;
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
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #F8FAFC;
}

.skill-desc {
  font-size: 12px;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748B;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #1E293B;
  border-top-color: #22C55E;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #475569;
  stroke-width: 2;
  margin-bottom: 12px;
}

.empty-state p,
.loading-state p {
  margin: 0;
  font-size: 14px;
}

.skills-container::-webkit-scrollbar {
  width: 6px;
}

.skills-container::-webkit-scrollbar-track {
  background: #0F172A;
  border-radius: 3px;
}

.skills-container::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.skills-container::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

@media (prefers-reduced-motion: reduce) {
  .skill-card,
  .search-input {
    transition: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

@media (max-width: 768px) {
  .skill-list {
    padding: 12px;
  }
  
  .skill-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .skill-card {
    padding: 10px;
  }
  
  .skill-icon {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}
</style>
