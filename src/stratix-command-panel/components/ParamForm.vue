<template>
  <div class="param-form">
    <div class="form-header">
      <h3 class="form-title">参数配置</h3>
      <div v-if="selectedSkill" class="skill-badge">
        {{ selectedSkill.name }}
      </div>
    </div>

    <div v-if="!selectedSkill" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <p>请先选择一个技能</p>
    </div>

    <template v-else>
      <div v-if="parameters.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 13l4 4L19 7"></path>
        </svg>
        <p>该技能无需配置参数</p>
      </div>

      <form v-else class="form-body" @submit.prevent="handleSubmit">
        <div
          v-for="param in parameters"
          :key="param.paramId"
          class="form-field"
          :class="{ 'has-error': errors[param.paramId] }"
        >
          <label class="field-label" :for="`param-${param.paramId}`">
            {{ param.name }}
            <span v-if="param.required" class="required-mark">*</span>
          </label>

          <div class="field-input-wrapper">
            <template v-if="param.type === 'string'">
              <input
                :id="`param-${param.paramId}`"
                v-model="formValues[param.paramId]"
                type="text"
                class="field-input"
                :placeholder="`请输入${param.name}`"
                @blur="validateField(param)"
                @focus="clearError(param.paramId)"
              />
            </template>

            <template v-else-if="param.type === 'number'">
              <input
                :id="`param-${param.paramId}`"
                v-model.number="formValues[param.paramId]"
                type="number"
                class="field-input"
                :placeholder="`请输入${param.name}`"
                @blur="validateField(param)"
                @focus="clearError(param.paramId)"
              />
            </template>

            <template v-else-if="param.type === 'boolean'">
              <button
                type="button"
                class="toggle-switch"
                :class="{ active: formValues[param.paramId] }"
                @click="toggleBoolean(param.paramId)"
              >
                <span class="toggle-slider"></span>
              </button>
              <span class="toggle-label">{{ formValues[param.paramId] ? '开启' : '关闭' }}</span>
            </template>

            <template v-else-if="param.type === 'object'">
              <textarea
                :id="`param-${param.paramId}`"
                v-model="formValues[param.paramId]"
                class="field-textarea"
                :placeholder="`请输入 JSON 格式的 ${param.name}`"
                rows="3"
                @blur="validateField(param)"
                @focus="clearError(param.paramId)"
              ></textarea>
            </template>
          </div>

          <transition name="error-fade">
            <div v-if="errors[param.paramId]" class="field-error">
              <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ errors[param.paramId] }}
            </div>
          </transition>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-reset" @click="resetForm">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            重置
          </button>
          <button type="submit" class="btn btn-submit" :disabled="!isFormValid">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            执行
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { StratixSkillConfig, StratixSkillParameter, StratixFrontendOperationEvent } from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import { ParamValidator } from '../utils/ParamValidator';

const selectedSkill = ref<StratixSkillConfig | null>(null);
const selectedAgentIds = ref<string[]>([]);
const formValues = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const parameters = computed<StratixSkillParameter[]>(() => {
  return selectedSkill.value?.parameters || [];
});

const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0;
});

const validateField = (param: StratixSkillParameter) => {
  const result = ParamValidator.validate(param, formValues.value[param.paramId]);
  
  if (!result.isValid) {
    errors.value[param.paramId] = result.errorMessage;
  } else {
    delete errors.value[param.paramId];
  }
};

const clearError = (paramId: string) => {
  if (errors.value[paramId]) {
    delete errors.value[paramId];
  }
};

const toggleBoolean = (paramId: string) => {
  formValues.value[paramId] = !formValues.value[paramId];
};

const resetForm = () => {
  if (selectedSkill.value) {
    formValues.value = ParamValidator.initializeFormValues(selectedSkill.value.parameters);
    errors.value = {};
  }
};

const handleSubmit = () => {
  if (!selectedSkill.value) return;

  const { isValid, errors: validationErrors } = ParamValidator.validateAll(
    selectedSkill.value.parameters,
    formValues.value
  );

  if (!isValid) {
    errors.value = validationErrors;
    return;
  }

  const event: StratixFrontendOperationEvent = {
    eventType: 'stratix:command_execute',
    payload: {
      agentIds: selectedAgentIds.value,
      skill: selectedSkill.value,
      command: {
        commandId: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        skillId: selectedSkill.value.skillId,
        agentId: selectedAgentIds.value[0] || '',
        params: { ...formValues.value },
        executeAt: Date.now()
      }
    },
    timestamp: Date.now(),
    requestId: `stratix-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  };

  StratixEventBus.emit(event);
};

const handleSkillSelected = (event: StratixFrontendOperationEvent) => {
  selectedSkill.value = event.payload.skill || null;
  selectedAgentIds.value = event.payload.agentIds || [];
  
  if (selectedSkill.value) {
    formValues.value = ParamValidator.initializeFormValues(selectedSkill.value.parameters);
    errors.value = {};
  }
};

watch(selectedSkill, (newSkill) => {
  if (newSkill) {
    formValues.value = ParamValidator.initializeFormValues(newSkill.parameters);
    errors.value = {};
  }
});

onMounted(() => {
  StratixEventBus.subscribe('stratix:skill_selected', handleSkillSelected);
});

onUnmounted(() => {
  StratixEventBus.unsubscribe('stratix:skill_selected', handleSkillSelected);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

.param-form {
  font-family: 'Fira Sans', sans-serif;
  background: #020617;
  border-radius: 12px;
  padding: 16px;
  color: #F8FAFC;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1E293B;
}

.form-title {
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #F8FAFC;
}

.skill-badge {
  font-size: 12px;
  color: #22C55E;
  background: rgba(34, 197, 94, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

.form-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-mark {
  color: #EF4444;
  font-weight: 600;
}

.field-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  color: #F8FAFC;
  font-size: 14px;
  font-family: 'Fira Sans', sans-serif;
  transition: border-color 200ms ease, box-shadow 200ms ease;
  resize: vertical;
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: #64748B;
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-field.has-error .field-input,
.form-field.has-error .field-textarea {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.field-textarea {
  min-height: 80px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 13px;
  cursor: pointer;
  transition: all 200ms ease;
  padding: 0;
}

.toggle-switch:hover {
  background: #334155;
}

.toggle-switch.active {
  background: #22C55E;
  border-color: #22C55E;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #F8FAFC;
  border-radius: 50%;
  transition: transform 200ms ease;
}

.toggle-switch.active .toggle-slider {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 13px;
  color: #94A3B8;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #EF4444;
  font-size: 12px;
  margin-top: 4px;
}

.error-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  flex-shrink: 0;
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 150ms ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
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

.btn-reset {
  flex: 1;
  background: #1E293B;
  color: #94A3B8;
  border-color: #334155;
}

.btn-reset:hover {
  background: #334155;
  color: #F8FAFC;
}

.btn-submit {
  flex: 2;
  background: #22C55E;
  color: #020617;
}

.btn-submit:hover:not(:disabled) {
  background: #16A34A;
}

.btn-submit:disabled {
  background: #334155;
  color: #64748B;
  cursor: not-allowed;
}

.form-body::-webkit-scrollbar {
  width: 6px;
}

.form-body::-webkit-scrollbar-track {
  background: #0F172A;
  border-radius: 3px;
}

.form-body::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.form-body::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

@media (prefers-reduced-motion: reduce) {
  .field-input,
  .field-textarea,
  .toggle-switch,
  .toggle-slider,
  .btn,
  .error-fade-enter-active,
  .error-fade-leave-active {
    transition: none;
  }
}

@media (max-width: 768px) {
  .param-form {
    padding: 12px;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .skill-badge {
    max-width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-reset,
  .btn-submit {
    flex: none;
    width: 100%;
  }
}
</style>
