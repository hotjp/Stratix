<template>
  <div class="command-log">
    <div class="log-header">
      <h3 class="log-title">指令日志</h3>
      <div class="log-actions">
        <div v-if="logs.length > 5" class="log-search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            placeholder="搜索日志..."
            class="search-input"
            type="text"
          />
        </div>
        <div class="filter-dropdown">
          <button class="filter-btn" @click="showFilterMenu = !showFilterMenu">
            <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </button>
          <transition name="dropdown-fade">
            <div v-if="showFilterMenu" class="filter-menu">
              <button
                :class="['filter-option', { active: statusFilter === 'all' }]"
                @click="statusFilter = 'all'; showFilterMenu = false"
              >
                全部状态
              </button>
              <button
                :class="['filter-option', { active: statusFilter === 'success' }]"
                @click="statusFilter = 'success'; showFilterMenu = false"
              >
                <span class="status-dot success"></span>
                执行成功
              </button>
              <button
                :class="['filter-option', { active: statusFilter === 'failed' }]"
                @click="statusFilter = 'failed'; showFilterMenu = false"
              >
                <span class="status-dot failed"></span>
                执行失败
              </button>
              <button
                :class="['filter-option', { active: statusFilter === 'running' }]"
                @click="statusFilter = 'running'; showFilterMenu = false"
              >
                <span class="status-dot running"></span>
                执行中
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <div v-if="filteredLogs.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <p>{{ searchQuery || statusFilter !== 'all' ? '未找到匹配的日志' : '暂无指令日志' }}</p>
    </div>

    <div v-else class="logs-container">
      <div
        v-for="log in filteredLogs"
        :key="log.commandId"
        class="log-item"
        :class="[`status-${log.status}`]"
        @click="showLogDetail(log)"
        tabindex="0"
        @keydown.enter="showLogDetail(log)"
      >
        <div class="log-status-icon">
          <svg v-if="log.status === 'pending'" class="status-svg pending" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg v-else-if="log.status === 'running'" class="status-svg running" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <svg v-else-if="log.status === 'success'" class="status-svg success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else-if="log.status === 'failed'" class="status-svg failed" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>

        <div class="log-content">
          <div class="log-main">
            <span class="log-skill">{{ log.skillName }}</span>
            <span class="log-agent">{{ log.agentName }}</span>
          </div>
          <div class="log-meta">
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-id">{{ log.commandId.slice(0, 12) }}...</span>
          </div>
        </div>

        <div class="log-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    </div>

    <LogDetailModal
      :visible="showDetailModal"
      :log="selectedLog"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { StratixStateSyncEvent, StratixFrontendOperationEvent } from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import LogDetailModal from './LogDetailModal.vue';

export interface CommandLogItem {
  commandId: string;
  agentId: string;
  agentName: string;
  skillId: string;
  skillName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  time: number;
  params?: Record<string, any>;
  result?: any;
  error?: string;
  duration?: number;
}

const logs = ref<CommandLogItem[]>([]);
const searchQuery = ref<string>('');
const statusFilter = ref<string>('all');
const showFilterMenu = ref<boolean>(false);
const showDetailModal = ref<boolean>(false);
const selectedLog = ref<CommandLogItem | null>(null);

const MAX_LOGS = 10;

const filteredLogs = computed(() => {
  let result = logs.value;

  if (statusFilter.value !== 'all') {
    result = result.filter(log => log.status === statusFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(log =>
      log.skillName.toLowerCase().includes(query) ||
      log.agentName.toLowerCase().includes(query) ||
      log.commandId.toLowerCase().includes(query)
    );
  }

  return result;
});

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

const addLog = (log: CommandLogItem) => {
  logs.value.unshift(log);
  if (logs.value.length > MAX_LOGS) {
    logs.value.pop();
  }
};

const updateLogStatus = (
  commandId: string,
  status: CommandLogItem['status'],
  result?: any,
  error?: string,
  duration?: number
) => {
  const log = logs.value.find(l => l.commandId === commandId);
  if (log) {
    log.status = status;
    if (result !== undefined) log.result = result;
    if (error !== undefined) log.error = error;
    if (duration !== undefined) log.duration = duration;
  }
};

const showLogDetail = (log: CommandLogItem) => {
  selectedLog.value = log;
  showDetailModal.value = true;
};

const handleCommandStatusUpdate = (event: StratixStateSyncEvent) => {
  const { commandId, commandStatus, data } = event.payload;
  if (commandId && commandStatus) {
    updateLogStatus(
      commandId,
      commandStatus as CommandLogItem['status'],
      data?.result,
      data?.error,
      data?.duration
    );
  }
};

const handleCommandExecute = (event: StratixFrontendOperationEvent) => {
  const { command, skill } = event.payload;
  if (command && skill) {
    addLog({
      commandId: command.commandId,
      agentId: command.agentId,
      agentName: command.agentId,
      skillId: command.skillId,
      skillName: skill.name,
      status: 'pending',
      time: command.executeAt || Date.now(),
      params: command.params
    });
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.filter-dropdown')) {
    showFilterMenu.value = false;
  }
};

onMounted(() => {
  StratixEventBus.subscribe('stratix:command_status_update', handleCommandStatusUpdate);
  StratixEventBus.subscribe('stratix:command_execute', handleCommandExecute);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  StratixEventBus.unsubscribe('stratix:command_status_update', handleCommandStatusUpdate);
  StratixEventBus.unsubscribe('stratix:command_execute', handleCommandExecute);
  document.removeEventListener('click', handleClickOutside);
});

defineExpose({
  addLog,
  updateLogStatus
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

.command-log {
  font-family: 'Fira Sans', sans-serif;
  background: #020617;
  border-radius: 12px;
  padding: 16px;
  color: #F8FAFC;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1E293B;
}

.log-title {
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #F8FAFC;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-search {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #64748B;
  stroke-width: 2;
}

.search-input {
  width: 140px;
  padding: 6px 10px 6px 32px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 6px;
  color: #F8FAFC;
  font-size: 12px;
  transition: border-color 200ms ease;
}

.search-input::placeholder {
  color: #64748B;
}

.search-input:focus {
  outline: none;
  border-color: #22C55E;
}

.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 6px;
  cursor: pointer;
  transition: all 200ms ease;
}

.filter-btn:hover {
  background: #1E293B;
  border-color: #334155;
}

.filter-icon {
  width: 16px;
  height: 16px;
  color: #94A3B8;
  stroke-width: 2;
}

.filter-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 4px;
  min-width: 140px;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94A3B8;
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;
  font-family: 'Fira Sans', sans-serif;
}

.filter-option:hover {
  background: #1E293B;
  color: #F8FAFC;
}

.filter-option.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22C55E;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.success { background: #22C55E; }
.status-dot.failed { background: #EF4444; }
.status-dot.running { background: #F59E0B; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748B;
  flex: 1;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #475569;
  stroke-width: 2;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.logs-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  gap: 12px;
}

.log-item:hover {
  background: #1E293B;
  border-color: #334155;
  transform: translateX(4px);
}

.log-item:focus {
  outline: none;
  border-color: #22C55E;
}

.log-status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.log-item.status-pending .log-status-icon {
  background: rgba(34, 211, 238, 0.15);
}

.log-item.status-running .log-status-icon {
  background: rgba(245, 158, 11, 0.15);
}

.log-item.status-success .log-status-icon {
  background: rgba(34, 197, 94, 0.15);
}

.log-item.status-failed .log-status-icon {
  background: rgba(239, 68, 68, 0.15);
}

.status-svg {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

.status-svg.pending { color: #22D3EE; }
.status-svg.running { 
  color: #F59E0B; 
  animation: pulse 1.5s ease-in-out infinite;
}
.status-svg.success { color: #22C55E; }
.status-svg.failed { color: #EF4444; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-skill {
  font-weight: 600;
  font-size: 13px;
  color: #F8FAFC;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-agent {
  font-size: 11px;
  color: #64748B;
  padding: 2px 6px;
  background: #1E293B;
  border-radius: 4px;
  flex-shrink: 0;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-time {
  font-size: 11px;
  color: #64748B;
}

.log-id {
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  color: #475569;
}

.log-arrow {
  flex-shrink: 0;
}

.log-arrow svg {
  width: 16px;
  height: 16px;
  color: #475569;
  stroke-width: 2;
}

.log-item:hover .log-arrow svg {
  color: #22C55E;
}

.logs-container::-webkit-scrollbar {
  width: 6px;
}

.logs-container::-webkit-scrollbar-track {
  background: #0F172A;
  border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .log-item,
  .filter-btn,
  .search-input,
  .filter-option,
  .status-svg.running,
  .dropdown-fade-enter-active,
  .dropdown-fade-leave-active {
    transition: none;
    animation: none;
  }
}

@media (max-width: 768px) {
  .command-log {
    padding: 12px;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .log-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-input {
    width: 120px;
  }

  .log-item {
    padding: 10px;
  }
}
</style>
