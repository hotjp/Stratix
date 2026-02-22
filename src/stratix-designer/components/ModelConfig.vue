<script setup lang="ts">
import { computed } from 'vue';
import { StratixModelConfig } from '@/stratix-core/stratix-protocol';

const props = defineProps<{
  modelValue: StratixModelConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixModelConfig): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const modelName = computed({
  get: () => props.modelValue.name,
  set: (value) => emit('update:modelValue', { ...props.modelValue, name: value }),
});

const updateParam = (key: string, value: number) => {
  emit('update:modelValue', {
    ...props.modelValue,
    params: {
      ...props.modelValue.params,
      [key]: value,
    },
  });
};

const temperature = computed({
  get: () => props.modelValue.params?.temperature ?? 0.7,
  set: (value) => updateParam('temperature', value),
});

const topP = computed({
  get: () => props.modelValue.params?.topP ?? 0.9,
  set: (value) => updateParam('topP', value),
});

const maxTokens = computed({
  get: () => props.modelValue.params?.maxTokens ?? 4096,
  set: (value) => updateParam('maxTokens', value),
});
</script>

<template>
  <div class="model-config">
    <el-form label-position="top">
      <el-form-item label="模型" required>
        <el-select v-model="modelName" placeholder="选择模型">
          <el-option-group label="Claude">
            <el-option label="Claude 3 Opus" value="claude-3-opus" />
            <el-option label="Claude 3 Sonnet" value="claude-3-sonnet" />
            <el-option label="Claude 3 Haiku" value="claude-3-haiku" />
          </el-option-group>
          <el-option-group label="GPT">
            <el-option label="GPT-4o" value="gpt-4o" />
            <el-option label="GPT-4 Turbo" value="gpt-4-turbo" />
            <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
          </el-option-group>
        </el-select>
      </el-form-item>

      <el-divider>模型参数</el-divider>

      <el-form-item label="Temperature">
        <el-row :gutter="20" align="middle">
          <el-col :span="16">
            <el-slider
              v-model="temperature"
              :min="0"
              :max="2"
              :step="0.1"
              show-stops
            />
          </el-col>
          <el-col :span="8">
            <el-input-number
              v-model="temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :precision="1"
              size="small"
            />
          </el-col>
        </el-row>
        <div class="param-hint">
          控制输出随机性，值越低越确定性
        </div>
      </el-form-item>

      <el-form-item label="Top P">
        <el-row :gutter="20" align="middle">
          <el-col :span="16">
            <el-slider
              v-model="topP"
              :min="0"
              :max="1"
              :step="0.1"
              show-stops
            />
          </el-col>
          <el-col :span="8">
            <el-input-number
              v-model="topP"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="1"
              size="small"
            />
          </el-col>
        </el-row>
        <div class="param-hint">
          核采样参数，控制输出多样性
        </div>
      </el-form-item>

      <el-form-item label="最大 Tokens">
        <el-input-number
          v-model="maxTokens"
          :min="100"
          :max="128000"
          :step="100"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.model-config {
  padding: 16px;
}

.param-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
