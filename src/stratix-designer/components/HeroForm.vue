<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Download, Check, Back } from '@element-plus/icons-vue';
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';
import { StratixHeroDesigner } from '../StratixHeroDesigner';
import { HeroType } from '../templates/types';
import SoulEditor from './SoulEditor.vue';
import SkillEditor from './SkillEditor.vue';
import MemoryEditor from './MemoryEditor.vue';
import ModelConfig from './ModelConfig.vue';

const props = defineProps<{
  agentId?: string;
  heroType?: HeroType;
  designer?: StratixHeroDesigner;
}>();

const emit = defineEmits<{
  (e: 'saved', config: StratixAgentConfig): void;
  (e: 'cancel'): void;
}>();

const designer = props.designer || new StratixHeroDesigner();
const activeTab = ref('soul');
const saving = ref(false);
const showPreview = ref(false);

const isNew = computed(() => !props.agentId);

const config = ref<StratixAgentConfig>(designer.createNewHero(props.heroType || 'writer'));

const rules = {
  name: [{ required: true, message: '请输入英雄名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择英雄类型', trigger: 'change' }],
};

const handleSave = async () => {
  try {
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
  try {
    designer.downloadHeroConfig(config.value.agentId);
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

const handleBack = () => {
  emit('cancel');
};

const copyJson = () => {
  const json = designer.exportHeroConfig(config.value.agentId);
  navigator.clipboard.writeText(json);
  ElMessage.success('已复制到剪贴板');
};

onMounted(async () => {
  if (props.agentId) {
    const loadedConfig = await designer.loadHeroConfig(props.agentId);
    if (loadedConfig) {
      config.value = loadedConfig;
    }
  }
});
</script>

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

    <el-form :model="config" :rules="rules" label-position="top">
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

    <el-dialog v-model="showPreview" title="配置预览" width="60%">
      <div class="preview-content">
        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
        <el-button type="primary" @click="copyJson">复制 JSON</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.hero-form {
  padding: 24px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.preview-content {
  max-height: 400px;
  overflow: auto;
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
}

.preview-content pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
