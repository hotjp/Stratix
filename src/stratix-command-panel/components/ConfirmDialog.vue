<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-container">
          <div class="dialog-header">
            <div class="dialog-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="dialog-title">确认执行指令</h3>
          </div>

          <div class="dialog-body">
            <div class="confirm-info">
              <div class="info-item">
                <span class="info-label">技能名称</span>
                <span class="info-value">{{ skillName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">目标 Agent</span>
                <span class="info-value highlight">{{ agentCount }} 个 Agent</span>
              </div>
              <div v-if="hasParams" class="info-item params-preview">
                <span class="info-label">参数预览</span>
                <div class="params-list">
                  <div v-for="(value, key) in params" :key="key" class="param-row">
                    <span class="param-key">{{ key }}</span>
                    <span class="param-value">{{ formatValue(value) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="warning-text">
              <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span v-if="agentCount > 1">将同时向 {{ agentCount }} 个 Agent 发送执行指令</span>
              <span v-else>即将向 Agent 发送执行指令</span>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-cancel" @click="handleCancel">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              取消
            </button>
            <button class="btn btn-confirm" @click="handleConfirm">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              确认执行
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  visible: boolean;
  skillName: string;
  agentCount: number;
  params: Record<string, any>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const hasParams = computed(() => {
  return props.params && Object.keys(props.params).length > 0;
});

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return;
  
  if (event.key === 'Escape') {
    handleCancel();
  } else if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleConfirm();
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

.dialog-overlay {
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

.dialog-container {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #1E293B;
}

.dialog-icon {
  width: 40px;
  height: 40px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-icon svg {
  width: 22px;
  height: 22px;
  color: #F59E0B;
  stroke-width: 2;
}

.dialog-title {
  font-family: 'Fira Code', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #F8FAFC;
  margin: 0;
}

.dialog-body {
  padding: 20px 24px;
}

.confirm-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #F8FAFC;
  font-weight: 500;
}

.info-value.highlight {
  color: #22C55E;
}

.params-preview {
  margin-top: 8px;
}

.params-list {
  background: #020617;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 12px;
  max-height: 120px;
  overflow-y: auto;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #1E293B;
}

.param-row:last-child {
  border-bottom: none;
}

.param-key {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #94A3B8;
}

.param-value {
  font-size: 12px;
  color: #22C55E;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  color: #F59E0B;
  font-size: 13px;
}

.warning-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: #020617;
  border-top: 1px solid #1E293B;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
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

.btn-cancel {
  background: #1E293B;
  color: #94A3B8;
  border-color: #334155;
}

.btn-cancel:hover {
  background: #334155;
  color: #F8FAFC;
}

.btn-confirm {
  background: #22C55E;
  color: #020617;
}

.btn-confirm:hover {
  background: #16A34A;
}

.params-list::-webkit-scrollbar {
  width: 4px;
}

.params-list::-webkit-scrollbar-track {
  background: #0F172A;
}

.params-list::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 200ms ease;
}

.dialog-fade-enter-active .dialog-container,
.dialog-fade-leave-active .dialog-container {
  transition: transform 200ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog-container {
  transform: scale(0.95) translateY(-10px);
}

.dialog-fade-leave-to .dialog-container {
  transform: scale(0.95) translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .dialog-fade-enter-active,
  .dialog-fade-leave-active,
  .dialog-fade-enter-active .dialog-container,
  .dialog-fade-leave-active .dialog-container,
  .btn {
    transition: none;
  }
}

@media (max-width: 768px) {
  .dialog-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .dialog-container {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
