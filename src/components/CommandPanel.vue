<script setup lang="ts">
import { StratixAgentConfig, StratixSkillConfig } from '../stratix-core';

defineProps<{
  selectedAgents: StratixAgentConfig[];
  commandLogs: any[];
}>();

const emit = defineEmits<{
  (e: 'execute', skill: StratixSkillConfig, params: Record<string, any>): void;
}>();
</script>

<template>
  <div class="command-panel">
    <h3>指令面板</h3>
    <div v-if="selectedAgents.length === 0" class="empty-state">
      请先在地图中选择英雄
    </div>
    <div v-else class="selected-info">
      <p>已选中 {{ selectedAgents.length }} 个英雄</p>
    </div>
  </div>
</template>

<style scoped>
.command-panel {
  padding: 12px;
}

.command-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

.selected-info {
  padding: 12px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  color: #00d4ff;
}
</style>
