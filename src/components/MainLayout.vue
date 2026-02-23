<script setup lang="ts">
import { ref, computed } from 'vue';
import { StratixAgentConfig, StratixSkillConfig } from '../stratix-core';
import AgentPanel from './AgentPanel.vue';
import CommandPanel from './CommandPanel.vue';
import SkillList from '../stratix-command-panel/components/SkillList.vue';
import ParamForm from '../stratix-command-panel/components/ParamForm.vue';
import CommandLog from '../stratix-command-panel/components/CommandLog.vue';
import { StratixEventBus, StratixFrontendOperationEvent } from '../stratix-core';
import { StratixRequestHelper } from '../stratix-core/utils';

const props = defineProps<{
  gameContainer: HTMLElement | null;
  isGameReady: boolean;
  agents: StratixAgentConfig[];
  selectedAgentIds: string[];
  commandLogs: any[];
}>();

const emit = defineEmits<{
  (e: 'create-agent', type: 'writer' | 'dev' | 'analyst'): void;
  (e: 'delete-agent', agentId: string): void;
  (e: 'select-agent', agentId: string): void;
  (e: 'open-character-creator'): void;
}>();

const activeTab = ref<'agents' | 'command' | 'logs'>('agents');
const selectedSkill = ref<StratixSkillConfig | null>(null);
const paramValues = ref<Record<string, any>>({});
const showParamForm = ref(false);
const eventBus = StratixEventBus.getInstance();
const requestHelper = StratixRequestHelper.getInstance();

const selectedAgents = computed(() => 
  props.agents.filter(a => props.selectedAgentIds.includes(a.agentId))
);

const currentSkills = computed(() => {
  if (selectedAgents.value.length === 0) return [];
  return selectedAgents.value[0].skills;
});

const handleSelectSkill = (skill: StratixSkillConfig) => {
  selectedSkill.value = skill;
  paramValues.value = {};
  skill.parameters.forEach(p => {
    paramValues.value[p.paramId] = p.defaultValue;
  });
  showParamForm.value = true;
};

const handleExecuteCommand = () => {
  if (!selectedSkill.value || props.selectedAgentIds.length === 0) return;
  
  const event: StratixFrontendOperationEvent = {
    eventType: 'stratix:command_execute',
    payload: {
      agentIds: props.selectedAgentIds,
      skill: selectedSkill.value,
      command: {
        commandId: requestHelper.generateRequestId().replace('req', 'cmd'),
        skillId: selectedSkill.value.skillId,
        agentId: props.selectedAgentIds[0],
        params: { ...paramValues.value },
        executeAt: Date.now()
      }
    },
    timestamp: Date.now(),
    requestId: requestHelper.generateRequestId()
  };
  
  eventBus.emit(event);
  showParamForm.value = false;
  selectedSkill.value = null;
};

const handleCancelCommand = () => {
  showParamForm.value = false;
  selectedSkill.value = null;
};
</script>

<template>
  <div class="main-layout">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">★</span>
        <span class="logo-text">Stratix 星策系统</span>
      </div>
      <div class="header-info">
        <span class="status" :class="{ ready: isGameReady }">
          {{ isGameReady ? '● 系统就绪' : '○ 加载中...' }}
        </span>
        <span class="agent-count">Agents: {{ agents.length }}</span>
      </div>
    </header>
    
    <main class="main-content">
      <aside class="sidebar left-sidebar">
        <div class="sidebar-tabs">
          <button 
            :class="{ active: activeTab === 'agents' }" 
            @click="activeTab = 'agents'"
          >英雄</button>
          <button 
            :class="{ active: activeTab === 'command' }" 
            @click="activeTab = 'command'"
          >指令</button>
          <button 
            :class="{ active: activeTab === 'logs' }" 
            @click="activeTab = 'logs'"
          >日志</button>
        </div>
        
        <div class="sidebar-content">
          <AgentPanel 
            v-if="activeTab === 'agents'"
            :agents="agents"
            :selected-ids="selectedAgentIds"
            @create="emit('create-agent', $event)"
            @delete="emit('delete-agent', $event)"
            @select="emit('select-agent', $event)"
            @open-character-creator="emit('open-character-creator')"
          />
          
          <div v-else-if="activeTab === 'command'" class="command-tab">
            <div v-if="selectedAgents.length === 0" class="empty-state">
              请先选择一个英雄
            </div>
            <template v-else>
              <div class="selected-agent-info">
                <h4>已选中: {{ selectedAgents[0].name }}</h4>
                <p>{{ selectedAgents[0].soul.identity }}</p>
              </div>
              <SkillList 
                :skills="currentSkills"
                @select="handleSelectSkill"
              />
              <ParamForm
                v-if="showParamForm && selectedSkill"
                :skill="selectedSkill"
                v-model="paramValues"
                @execute="handleExecuteCommand"
                @cancel="handleCancelCommand"
              />
            </template>
          </div>
          
          <CommandLog 
            v-else-if="activeTab === 'logs'"
            :logs="commandLogs"
          />
        </div>
      </aside>
      
      <section class="game-area">
        <slot name="game"></slot>
      </section>
      
      <aside class="sidebar right-sidebar">
        <h3>状态面板</h3>
        <div class="status-section">
          <h4>选中英雄</h4>
          <div v-if="selectedAgents.length > 0" class="selected-info">
            <div v-for="agent in selectedAgents" :key="agent.agentId" class="agent-item">
              <span class="agent-name">{{ agent.name }}</span>
              <span class="agent-type">{{ agent.type }}</span>
            </div>
          </div>
          <div v-else class="empty-state">未选中</div>
        </div>
        
        <div class="status-section">
          <h4>系统状态</h4>
          <div class="system-status">
            <div class="status-item">
              <span class="label">RTS 引擎</span>
              <span class="value" :class="{ ok: isGameReady }">
                {{ isGameReady ? '运行中' : '加载中' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">事件总线</span>
              <span class="value ok">已连接</span>
            </div>
            <div class="status-item">
              <span class="label">数据存储</span>
              <span class="value ok">本地模式</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
}

.header {
  height: 48px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid #2a2a4e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
  color: #00d4ff;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status {
  font-size: 14px;
  color: #888;
}

.status.ready {
  color: #00ff88;
}

.agent-count {
  font-size: 14px;
  color: #888;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #1a1a2e;
  border-right: 1px solid #2a2a4e;
  display: flex;
  flex-direction: column;
}

.right-sidebar {
  border-right: none;
  border-left: 1px solid #2a2a4e;
  padding: 16px;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a4e;
}

.sidebar-tabs button {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-tabs button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-tabs button.active {
  color: #00d4ff;
  border-bottom: 2px solid #00d4ff;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.game-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.command-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-agent-info {
  padding: 12px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.selected-agent-info h4 {
  margin: 0 0 4px 0;
  color: #00d4ff;
}

.selected-agent-info p {
  margin: 0;
  font-size: 12px;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.right-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #fff;
}

.status-section {
  margin-bottom: 20px;
}

.status-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #888;
  text-transform: uppercase;
}

.selected-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.agent-name {
  color: #fff;
}

.agent-type {
  color: #00d4ff;
  font-size: 12px;
}

.system-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.status-item .label {
  color: #888;
  font-size: 13px;
}

.status-item .value {
  font-size: 13px;
  color: #ff6b6b;
}

.status-item .value.ok {
  color: #00ff88;
}
</style>
