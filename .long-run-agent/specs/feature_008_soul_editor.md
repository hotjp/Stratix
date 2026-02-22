# Feature 008: Soul Editor Component

## Feature Overview
Implement the Soul configuration editor component for editing agent identity, goals, and personality.

## Module
stratix-designer

## Priority
P1 (High)

## Dependencies
- Vue 3
- Element Plus
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/components/SoulEditor.vue

```vue
<template>
  <div class="soul-editor">
    <el-form :model="soul" label-position="top">
      <el-form-item label="身份" required>
        <el-input 
          v-model="soul.identity" 
          type="textarea"
          :rows="3"
          placeholder="描述英雄的身份和定位..."
        />
      </el-form-item>
      
      <el-form-item label="目标" required>
        <GoalList v-model="soul.goals" />
      </el-form-item>
      
      <el-form-item label="性格">
        <el-input 
          v-model="soul.personality" 
          type="textarea"
          :rows="2"
          placeholder="描述英雄的性格特点..."
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { StratixSoulConfig } from '@/stratix-core/stratix-protocol';
import GoalList from './GoalList.vue';

const props = defineProps<{
  modelValue: StratixSoulConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixSoulConfig): void;
}>();

const soul = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script>
```

### Sub-component: GoalList.vue
Manages the list of goals with add/remove functionality.

## Component Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| modelValue | StratixSoulConfig | Yes | Soul configuration object |

## Component Events
| Event | Payload | When |
|-------|---------|------|
| update:modelValue | StratixSoulConfig | On any field change |

## UI Elements
1. **Identity Textarea** - 3 rows, required
2. **Goals List** - Dynamic list with add/remove buttons
3. **Personality Textarea** - 2 rows, optional

## GoalList Component Features
- Display goals as list items
- Add new goal button
- Remove goal button (per item)
- Inline editing
- Minimum 1 goal validation

## Styling
- Use Element Plus form components
- Consistent spacing and typography
- Responsive layout

## Acceptance Criteria
- [ ] Identity field is required
- [ ] At least one goal required
- [ ] Goals can be added/removed
- [ ] Changes emit update events
- [ ] Form validation works

## Estimated Time
1 day
