<script setup lang="ts">
import { computed } from 'vue';
import { StratixMemoryConfig } from '@/stratix-core/stratix-protocol';

const props = defineProps<{
  modelValue: StratixMemoryConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixMemoryConfig): void;
}>();

const memory = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const context = computed({
  get: () => props.modelValue.context,
  set: (value) => emit('update:modelValue', { ...props.modelValue, context: value }),
});

const addItem = (type: 'shortTerm' | 'longTerm') => {
  emit('update:modelValue', {
    ...props.modelValue,
    [type]: [...props.modelValue[type], ''],
  });
};

const removeItem = (type: 'shortTerm' | 'longTerm', index: number) => {
  const newList = [...props.modelValue[type]];
  newList.splice(index, 1);
  emit('update:modelValue', { ...props.modelValue, [type]: newList });
};

const updateItem = (type: 'shortTerm' | 'longTerm', index: number, value: string) => {
  const newList = [...props.modelValue[type]];
  newList[index] = value;
  emit('update:modelValue', { ...props.modelValue, [type]: newList });
};
</script>

<template>
  <div class="memory-editor">
    <el-collapse v-model="activePanels">
      <el-collapse-item title="短期记忆" name="shortTerm">
        <div class="memory-list">
          <el-tag
            v-for="(item, index) in memory.shortTerm"
            :key="index"
            closable
            @close="removeItem('shortTerm', index)"
            class="memory-tag"
          >
            {{ item || `记忆 ${index + 1}` }}
          </el-tag>
          <el-input
            v-if="addingShortTerm"
            v-model="newShortTerm"
            size="small"
            placeholder="输入记忆内容"
            @keyup.enter="confirmAdd('shortTerm')"
            @blur="confirmAdd('shortTerm')"
          />
          <el-button v-else type="primary" link size="small" @click="addingShortTerm = true">
            + 添加
          </el-button>
        </div>
      </el-collapse-item>

      <el-collapse-item title="长期记忆" name="longTerm">
        <div class="memory-list">
          <el-tag
            v-for="(item, index) in memory.longTerm"
            :key="index"
            closable
            @close="removeItem('longTerm', index)"
            class="memory-tag"
          >
            {{ item || `记忆 ${index + 1}` }}
          </el-tag>
          <el-button type="primary" link size="small" @click="addItem('longTerm')">
            + 添加
          </el-button>
        </div>
      </el-collapse-item>

      <el-collapse-item title="上下文" name="context">
        <el-input
          v-model="context"
          type="textarea"
          :rows="4"
          placeholder="描述英雄的上下文背景..."
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
export default {
  data() {
    return {
      activePanels: ['context'] as string[],
      addingShortTerm: false,
      newShortTerm: '',
    };
  },
  methods: {
    confirmAdd(type: 'shortTerm' | 'longTerm') {
      if (this.newShortTerm.trim()) {
        this.addItem(type);
      }
      this.addingShortTerm = false;
      this.newShortTerm = '';
    },
  },
};
</script>

<style scoped>
.memory-editor {
  padding: 16px;
}

.memory-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.memory-tag {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
