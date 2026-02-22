<script setup lang="ts">
import { computed } from 'vue';
import { StratixSoulConfig } from '@/stratix-core/stratix-protocol';

const props = defineProps<{
  modelValue: StratixSoulConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixSoulConfig): void;
}>();

const soul = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const identity = computed({
  get: () => props.modelValue.identity,
  set: (value) => emit('update:modelValue', { ...props.modelValue, identity: value }),
});

const personality = computed({
  get: () => props.modelValue.personality,
  set: (value) => emit('update:modelValue', { ...props.modelValue, personality: value }),
});

const addGoal = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    goals: [...props.modelValue.goals, ''],
  });
};

const removeGoal = (index: number) => {
  const newGoals = [...props.modelValue.goals];
  newGoals.splice(index, 1);
  emit('update:modelValue', { ...props.modelValue, goals: newGoals });
};

const updateGoal = (index: number, value: string) => {
  const newGoals = [...props.modelValue.goals];
  newGoals[index] = value;
  emit('update:modelValue', { ...props.modelValue, goals: newGoals });
};
</script>

<template>
  <div class="soul-editor">
    <el-form label-position="top">
      <el-form-item label="身份" required>
        <el-input
          v-model="identity"
          type="textarea"
          :rows="3"
          placeholder="描述英雄的身份和定位..."
        />
      </el-form-item>

      <el-form-item label="目标" required>
        <div class="goals-list">
          <div v-for="(goal, index) in soul.goals" :key="index" class="goal-item">
            <el-input
              :model-value="goal"
              @update:model-value="updateGoal(index, $event)"
              :placeholder="`目标 ${index + 1}`"
            >
              <template #suffix>
                <el-button
                  type="danger"
                  link
                  @click="removeGoal(index)"
                  :disabled="soul.goals.length <= 1"
                >
                  删除
                </el-button>
              </template>
            </el-input>
          </div>
          <el-button type="primary" link @click="addGoal">
            + 添加目标
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="性格">
        <el-input
          v-model="personality"
          type="textarea"
          :rows="2"
          placeholder="描述英雄的性格特点..."
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.soul-editor {
  padding: 16px;
}

.goals-list {
  width: 100%;
}

.goal-item {
  margin-bottom: 8px;
}
</style>
