# Feature 009: Skill Editor Component

## Feature Overview
Implement the Skill configuration editor component for managing agent skills and their parameters.

## Module
stratix-designer

## Priority
P1 (High)

## Dependencies
- Vue 3
- Element Plus
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-designer/components/SkillEditor.vue

```vue
<template>
  <div class="skill-editor">
    <div class="skill-list">
      <el-card v-for="(skill, index) in skills" :key="skill.skillId" class="skill-card">
        <SkillItem 
          :model-value="skill"
          @update:model-value="updateSkill(index, $event)"
          @remove="removeSkill(index)"
        />
      </el-card>
    </div>
    
    <el-button type="primary" @click="addSkill">
      <el-icon><Plus /></el-icon>
      添加技能
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { StratixSkillConfig } from '@/stratix-core/stratix-protocol';
import SkillItem from './SkillItem.vue';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: StratixSkillConfig[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixSkillConfig[]): void;
}>();

const skills = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const addSkill = () => {
  const newSkill: StratixSkillConfig = {
    skillId: `stratix-skill-${Date.now()}`,
    name: '',
    description: '',
    parameters: [],
    executeScript: ''
  };
  emit('update:modelValue', [...props.modelValue, newSkill]);
};

const removeSkill = (index: number) => {
  const newSkills = [...props.modelValue];
  newSkills.splice(index, 1);
  emit('update:modelValue', newSkills);
};

const updateSkill = (index: number, skill: StratixSkillConfig) => {
  const newSkills = [...props.modelValue];
  newSkills[index] = skill;
  emit('update:modelValue', newSkills);
};
</script>
```

### Sub-component: SkillItem.vue
Individual skill editing card with parameter management.

### Sub-component: ParameterEditor.vue
Parameter configuration editor for each skill.

## SkillItem Component Features
- Skill name input
- Skill description textarea
- Parameter list (using ParameterEditor)
- Execute script editor (JSON format)
- Remove button

## ParameterEditor Component Features
- Parameter ID input
- Parameter name input
- Type selector (string, number, boolean)
- Required checkbox
- Default value input

## Component Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| modelValue | StratixSkillConfig[] | Yes | Skills array |

## Component Events
| Event | Payload | When |
|-------|---------|------|
| update:modelValue | StratixSkillConfig[] | On any change |

## Validation Rules
- skillId must start with `stratix-skill-`
- At least one skill required
- Each parameter must have valid type

## Acceptance Criteria
- [ ] Skills can be added/removed
- [ ] Parameters can be managed
- [ ] Execute script validates JSON
- [ ] SkillId auto-generated
- [ ] At least one skill validation

## Estimated Time
1 day
