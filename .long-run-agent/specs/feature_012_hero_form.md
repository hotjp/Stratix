# Feature 012: Hero Form Main Component

## Feature Overview
Implement the main hero configuration form component that integrates all editor components and provides save/export functionality.

## Module
stratix-designer

## Priority
P1 (High)

## Dependencies
- Vue 3
- Element Plus
- stratix-core (stratix-protocol.ts)
- ./StratixHeroDesigner.ts
- ./components/* (all editor components)

## Implementation Details

### File: src/stratix-designer/components/HeroForm.vue

```vue
<template>
  <div class="hero-form">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="title">{{ isNew ? '创建英雄' : '编辑英雄' }}</span>
      </template>
      <template #extra>
        <el-button-group>
          <el-button @click="handlePreview">
            <el-icon><View /></el-icon>
            预览
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </el-button-group>
      </template>
    </el-page-header>
    
    <el-divider />
    
    <el-form :model="config" :rules="rules" ref="formRef" label-position="top">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="英雄名称" prop="name">
            <el-input v-model="config.name" placeholder="输入英雄名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="英雄类型" prop="type">
            <el-select v-model="config.type" placeholder="选择类型">
              <el-option label="文案英雄" value="writer" />
              <el-option label="开发英雄" value="dev" />
              <el-option label="数据分析英雄" value="analyst" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Agent ID">
            <el-input :value="config.agentId" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Soul" name="soul">
          <SoulEditor v-model="config.soul" />
        </el-tab-pane>
        
        <el-tab-pane label="技能" name="skills">
          <SkillEditor v-model="config.skills" />
        </el-tab-pane>
        
        <el-tab-pane label="记忆" name="memory">
          <MemoryEditor v-model="config.memory" />
        </el-tab-pane>
        
        <el-tab-pane label="模型" name="model">
          <ModelConfig v-model="config.model" />
        </el-tab-pane>
      </el-tabs>
    </el-form>
    
    <ConfigPreviewDialog 
      v-model="showPreview"
      :config="config"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';
import { StratixHeroDesigner } from '../StratixHeroDesigner';
import SoulEditor from './SoulEditor.vue';
import SkillEditor from './SkillEditor.vue';
import MemoryEditor from './MemoryEditor.vue';
import ModelConfig from './ModelConfig.vue';
import ConfigPreviewDialog from './ConfigPreviewDialog.vue';
import { View, Download, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  agentId?: string;
  heroType?: 'writer' | 'dev' | 'analyst';
}>();

const emit = defineEmits<{
  (e: 'saved', config: StratixAgentConfig): void;
  (e: 'cancel'): void;
}>();

const designer = new StratixHeroDesigner();
const formRef = ref();
const activeTab = ref('soul');
const saving = ref(false);
const showPreview = ref(false);

const isNew = computed(() => !props.agentId);

const config = ref<StratixAgentConfig>(designer.createNewHero(props.heroType || 'writer'));

const rules = {
  name: [{ required: true, message: '请输入英雄名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择英雄类型', trigger: 'change' }]
};

const handleSave = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;
    const result = await designer.saveHeroConfig(config.value);
    if (result.code === 200) {
      ElMessage.success('保存成功');
      emit('saved', config.value);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const handlePreview = () => {
  showPreview.value = true;
};

const handleExport = () => {
  designer.exportHeroConfig(config.value.agentId);
  ElMessage.success('导出成功');
};

const handleBack = () => {
  emit('cancel');
};

onMounted(async () => {
  if (props.agentId) {
    config.value = await designer.loadHeroConfig(props.agentId);
  }
});
</script>
```

### Sub-component: ConfigPreviewDialog.vue
Modal dialog showing JSON preview of configuration.

## Component Structure
```
HeroForm
├── Page Header (title + action buttons)
├── Basic Info Row (name, type, agentId)
├── Tabs
│   ├── Soul Tab → SoulEditor
│   ├── Skills Tab → SkillEditor
│   ├── Memory Tab → MemoryEditor
│   └── Model Tab → ModelConfig
└── ConfigPreviewDialog
```

## Component Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| agentId | string | No | Existing agent ID for editing |
| heroType | 'writer' \| 'dev' \| 'analyst' | No | Default type for new hero |

## Component Events
| Event | Payload | When |
|-------|---------|------|
| saved | StratixAgentConfig | After successful save |
| cancel | - | On back/cancel |

## Actions
| Action | Description |
|--------|-------------|
| 预览 | Open preview dialog |
| 导出 | Download config as JSON |
| 保存 | Save config via API |

## Form Validation
- name: required
- type: required
- skills: at least one

## ConfigPreviewDialog Features
- JSON syntax highlighting
- Copy to clipboard
- Formatted display

## Acceptance Criteria
- [ ] All tabs render correctly
- [ ] Save triggers API call
- [ ] Export downloads file
- [ ] Preview shows correct JSON
- [ ] Form validation works
- [ ] Load existing config on edit

## Estimated Time
1 day
