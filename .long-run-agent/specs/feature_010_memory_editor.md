# Feature 010: Memory Editor Component

## Feature Overview
Implement the Memory configuration editor component for managing agent memory settings.

## Module
stratix-designer

## Priority
P1 (High)

## Dependencies
- Vue 3
- Element Plus
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/components/MemoryEditor.vue

```vue
<template>
  <div class="memory-editor">
    <el-collapse v-model="activePanels">
      <el-collapse-item title="短期记忆" name="shortTerm">
        <MemoryItemList 
          v-model="memory.shortTerm"
          placeholder="添加短期记忆项..."
        />
      </el-collapse-item>
      
      <el-collapse-item title="长期记忆" name="longTerm">
        <MemoryItemList 
          v-model="memory.longTerm"
          placeholder="添加长期记忆项..."
        />
      </el-collapse-item>
      
      <el-collapse-item title="上下文" name="context">
        <el-input
          v-model="memory.context"
          type="textarea"
          :rows="4"
          placeholder="描述英雄的上下文背景..."
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue';
import { StratixMemoryConfig } from '@/stratix-core/stratix-protocol';
import MemoryItemList from './MemoryItemList.vue';

const props = defineProps<{
  modelValue: StratixMemoryConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixMemoryConfig): void;
}>();

const activePanels = ref(['context']);

const memory = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script>
```

### Sub-component: MemoryItemList.vue
Manages a list of memory items.

## Component Structure
```
MemoryEditor
├── Collapse Panel: 短期记忆
│   └── MemoryItemList
├── Collapse Panel: 长期记忆
│   └── MemoryItemList
└── Collapse Panel: 上下文
    └── Textarea
```

## MemoryItemList Component Features
- Display memory items as tags
- Add new item input
- Remove item button
- Inline editing
- Empty state handling

## Component Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| modelValue | StratixMemoryConfig | Yes | Memory configuration |

## Component Events
| Event | Payload | When |
|-------|---------|------|
| update:modelValue | StratixMemoryConfig | On any change |

## Memory Structure
```typescript
interface StratixMemoryConfig {
  shortTerm: string[];    // Short-term memory items
  longTerm: string[];     // Long-term memory items
  context: string;        // Context description
}
```

## UI Behavior
- Collapse panels for organization
- Context panel open by default
- Tags for memory items
- Simple add/remove interface

## Acceptance Criteria
- [ ] Three sections properly separated
- [ ] Memory items can be added/removed
- [ ] Context textarea works
- [ ] Changes emit update events
- [ ] Collapsible panels work

## Estimated Time
0.5 days
