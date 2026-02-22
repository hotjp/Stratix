<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="dialog-overlay" @click.self="$emit('cancel')">
        <div class="dialog-container">
          <div class="dialog-header">
            <div class="dialog-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
            </div>
            <h3 class="dialog-title">取消指令确认</h3>
          </div>

          <div class="dialog-body">
            <p class="dialog-desc">确定要取消此指令吗？此操作不可撤销。</p>
            
            <div v-if="log" class="command-info">
              <div class="info-row">
                <span class="info-label">指令 ID</span>
                <span class="info-value mono">{{ log.commandId.slice(0, 20) }}...</span>
              </div>
              <div class="info-row">
                <span class="info-label">技能名称</span>
                <span class="info-value">{{ log.skillName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Agent</span>
                <span class="info-value">{{ log.agentName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">当前状态</span>
                <span class="info-value">
                  <span :class="['status-badge', `status-${log.status}`]">
                    {{ statusText }}
                  </span>
                </span>
              </div>
            </div>

            <div class="warning-box">
              <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>取消后指令将终止执行，Agent 状态将恢复</span>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-cancel" @click="$emit('cancel')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              返回
            </button>
            <button class="btn btn-confirm" @click="$emit('confirm')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
              确认取消
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
  confirm: [];
  cancel: [];
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

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return;
  if (event.key === 'Escape') {
    emit('cancel');
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
  max-width: 400px;
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
  background: rgba(239, 68, 68, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-icon svg {
  width: 22px;
  height: 22px;
  color: #EF4444;
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

.dialog-desc {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #94A3B8;
}

.command-info {
  background: #020617;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #1E293B;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
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
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
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

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
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
  margin-top: 1px;
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
  background: #EF4444;
  color: #FFFFFF;
}

.btn-confirm:hover {
  background: #DC2626;
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
