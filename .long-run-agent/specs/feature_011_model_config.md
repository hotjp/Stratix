# Feature 011: Model Config Component

## Feature Overview
Implement the Model configuration component for editing agent model parameters.

## Module
stratix-designer

## Priority
P1 (High)

## Dependencies
- Vue 3
- Element Plus
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/components/ModelConfig.vue

```vue
<template>
  <div class="model-config">
    <el-form :model="model" label-position="top">
      <el-form-item label="模型" required>
        <el-select v-model="model.name" placeholder="选择模型">
          <el-option label="Claude 3 Opus" value="claude-3-opus" />
          <el-option label="Claude 3 Sonnet" value="claude-3-sonnet" />
          <el-option label="Claude 3 Haiku" value="claude-3-haiku" />
          <el-option label="GPT-4o" value="gpt-4o" />
          <el-option label="GPT-4 Turbo" value="gpt-4-turbo" />
          <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
        </el-select>
      </el-form-item>
      
      <el-divider>模型参数</el-divider>
      
      <el-form-item label="Temperature">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-slider 
              v-model="temperature"
              :min="0"
              :max="2"
              :step="0.1"
              show-input
            />
          </el-col>
          <el-col :span="6">
            <el-input-number 
              v-model="temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :precision="1"
            />
          </el-col>
        </el-row>
        <div class="param-hint">
          控制输出随机性，值越低越确定性
        </div>
      </el-form-item>
      
      <el-form-item label="Top P">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-slider 
              v-model="topP"
              :min="0"
              :max="1"
              :step="0.1"
              show-input
            />
          </el-col>
          <el-col :span="6">
            <el-input-number 
              v-model="topP"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="1"
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

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { StratixModelConfig } from '@/stratix-core/stratix-protocol';

const props = defineProps<{
  modelValue: StratixModelConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixModelConfig): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const temperature = computed({
  get: () => props.modelValue.params?.temperature ?? 0.7,
  set: (value) => updateParams('temperature', value)
});

const topP = computed({
  get: () => props.modelValue.params?.topP ?? 0.9,
  set: (value) => updateParams('topP', value)
});

const maxTokens = computed({
  get: () => props.modelValue.params?.maxTokens ?? 4096,
  set: (value) => updateParams('maxTokens', value)
});

const updateParams = (key: string, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    params: {
      ...props.modelValue.params,
      [key]: value
    }
  });
};
</script>
```

## Component Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| modelValue | StratixModelConfig | Yes | Model configuration |

## Component Events
| Event | Payload | When |
|-------|---------|------|
| update:modelValue | StratixModelConfig | On any change |

## Available Models
| Model | Description | Recommended For |
|-------|-------------|-----------------|
| claude-3-opus | Most capable | Complex analysis |
| claude-3-sonnet | Balanced | General purpose |
| claude-3-haiku | Fast | Simple tasks |
| gpt-4o | Latest GPT | Development |
| gpt-4-turbo | Fast GPT-4 | Development |
| gpt-3.5-turbo | Economical | Simple tasks |

## Parameter Ranges
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| temperature | 0 | 2 | 0.7 | 0.1 |
| topP | 0 | 1 | 0.9 | 0.1 |
| maxTokens | 100 | 128000 | 4096 | 100 |

## UI Features
- Model dropdown selector
- Slider + input for temperature
- Slider + input for topP
- Number input for maxTokens
- Helpful hints for each parameter

## Acceptance Criteria
- [ ] Model selection works
- [ ] Temperature slider/input synced
- [ ] TopP slider/input synced
- [ ] MaxTokens within valid range
- [ ] Changes emit update events

## Estimated Time
0.5 days
