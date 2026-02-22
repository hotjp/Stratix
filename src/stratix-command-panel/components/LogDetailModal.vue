<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <div class="header-left">
              <div class="status-badge" :class="`status-${log?.status}`">
                <svg v-if="log?.status === 'pending'" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <svg v-else-if="log?.status === 'running'" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <svg v-else-if="log?.status === 'success'" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else-if="log?.status === 'failed'" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="status-text">{{ statusText }}</span>
              </div>
              <h3 class="modal-title">指令详情</h3>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="log" class="detail-sections">
              <section class="detail-section">
                <h4 class="section-title">基本信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">指令 ID</span>
                    <span class="info-value mono">{{ log.commandId }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">技能名称</span>
                    <span class="info-value">{{ log.skillName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Agent</span>
                    <span class="info-value">{{ log.agentName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">执行时间</span>
                    <span class="info-value">{{ formatFullTime(log.time) }}</span>
                  </div>
                  <div v-if="log.duration" class="info-item">
                    <span class="info-label">执行耗时</span>
                    <span class="info-value">{{ log.duration }}ms</span>
                  </div>
                </div>
              </section>

              <section v-if="log.params && Object.keys(log.params).length > 0" class="detail-section">
                <h4 class="section-title">指令参数</h4>
                <div class="code-block">
                  <pre><code>{{ formatJSON(log.params) }}</code></pre>
                </div>
              </section>

              <section v-if="log.status === 'success' && log.result !== undefined" class="detail-section">
                <h4 class="section-title success-title">执行结果</h4>
                <div class="code-block success">
                  <pre><code>{{ formatJSON(log.result) }}</code></pre>
                </div>
              </section>

              <section v-if="log.status === 'failed' && log.error" class="detail-section">
                <h4 class="section-title error-title">错误信息</h4>
                <div class="error-block">
                  <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{{ log.error }}</span>
                </div>
              </section>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="copyToClipboard">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制指令 ID
            </button>
            <button class="btn btn-primary" @click="$emit('close')">
              关闭
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import type { CommandLogItem } from './CommandLog.vue';

interface Props {
  visible: boolean;
  log: CommandLogItem | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const statusText = computed(() => {
  if (!props.log) return '';
  const texts: Record<string, string> = {
    pending: '等待执行',
    running: '执行中',
    success: '执行成功',
    failed: '执行失败'
  };
  return texts[props.log.status] || props.log.status;
});

const formatFullTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatJSON = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

const copyToClipboard = async () => {
  if (!props.log) return;
  try {
    await navigator.clipboard.writeText(props.log.commandId);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return;
  if (event.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #1E293B;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-pending {
  background: rgba(34, 211, 238, 0.15);
  color: #22D3EE;
}

.status-badge.status-running {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
}

.status-badge.status-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22C55E;
}

.status-badge.status-failed {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}

.status-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.5;
}

.status-text {
  font-family: 'Fira Sans', sans-serif;
}

.modal-title {
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #F8FAFC;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
}

.close-btn:hover {
  background: #1E293B;
  border-color: #475569;
}

.close-btn svg {
  width: 16px;
  height: 16px;
  color: #94A3B8;
  stroke-width: 2;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.success-title {
  color: #22C55E;
}

.error-title {
  color: #EF4444;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #F8FAFC;
}

.info-value.mono {
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: #94A3B8;
  word-break: break-all;
}

.code-block {
  background: #020617;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
}

.code-block.success {
  border-color: rgba(34, 197, 94, 0.3);
}

.code-block pre {
  margin: 0;
}

.code-block code {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.6;
}

.error-block {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #EF4444;
  font-size: 13px;
}

.error-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
  margin-top: 1px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #020617;
  border-top: 1px solid #1E293B;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  border: 1px solid transparent;
  font-family: 'Fira Sans', sans-serif;
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.btn-secondary {
  background: #1E293B;
  color: #94A3B8;
  border-color: #334155;
}

.btn-secondary:hover {
  background: #334155;
  color: #F8FAFC;
}

.btn-primary {
  background: #22C55E;
  color: #020617;
}

.btn-primary:hover {
  background: #16A34A;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #0F172A;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.code-block::-webkit-scrollbar {
  height: 6px;
}

.code-block::-webkit-scrollbar-track {
  background: #0F172A;
}

.code-block::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container {
  transform: scale(0.95) translateY(-10px);
}

.modal-fade-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .modal-container,
  .modal-fade-leave-active .modal-container,
  .btn,
  .close-btn {
    transition: none;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .modal-container {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
