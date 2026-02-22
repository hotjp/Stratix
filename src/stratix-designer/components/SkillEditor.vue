<script setup lang="ts">
import { ref, computed } from 'vue';
import { StratixSkillConfig, StratixSkillParameter } from '@/stratix-core/stratix-protocol';
import { generateSkillId } from '../templates/types';

const props = defineProps<{
  modelValue: StratixSkillConfig[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StratixSkillConfig[]): void;
}>();

const skills = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const activeSkill = ref<string | null>(null);

const addSkill = () => {
  const newSkill: StratixSkillConfig = {
    skillId: generateSkillId(`custom-${Date.now()}`),
    name: '',
    description: '',
    parameters: [],
    executeScript: '',
  };
  emit('update:modelValue', [...props.modelValue, newSkill]);
  activeSkill.value = newSkill.skillId;
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

const addParameter = (skillIndex: number) => {
  const skill = props.modelValue[skillIndex];
  const newParam: StratixSkillParameter = {
    paramId: `param-${Date.now()}`,
    name: '',
    type: 'string',
    required: false,
    defaultValue: '',
  };
  updateSkill(skillIndex, {
    ...skill,
    parameters: [...skill.parameters, newParam],
  });
};

const removeParameter = (skillIndex: number, paramIndex: number) => {
  const skill = props.modelValue[skillIndex];
  const newParams = [...skill.parameters];
  newParams.splice(paramIndex, 1);
  updateSkill(skillIndex, { ...skill, parameters: newParams });
};

const updateParameter = (skillIndex: number, paramIndex: number, param: StratixSkillParameter) => {
  const skill = props.modelValue[skillIndex];
  const newParams = [...skill.parameters];
  newParams[paramIndex] = param;
  updateSkill(skillIndex, { ...skill, parameters: newParams });
};
</script>

<template>
  <div class="skill-editor">
    <el-collapse v-model="activeSkill" accordion>
      <el-collapse-item
        v-for="(skill, sIndex) in skills"
        :key="skill.skillId"
        :name="skill.skillId"
      >
        <template #title>
          <div class="skill-title">
            <span>{{ skill.name || '未命名技能' }}</span>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="removeSkill(sIndex)"
              :disabled="skills.length <= 1"
            >
              删除
            </el-button>
          </div>
        </template>

        <el-form label-position="top" class="skill-form">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="技能 ID">
                <el-input :model-value="skill.skillId" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="技能名称" required>
                <el-input
                  :model-value="skill.name"
                  @update:model-value="updateSkill(sIndex, { ...skill, name: $event })"
                  placeholder="输入技能名称"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="技能描述">
            <el-input
              :model-value="skill.description"
              @update:model-value="updateSkill(sIndex, { ...skill, description: $event })"
              type="textarea"
              :rows="2"
              placeholder="描述技能的功能..."
            />
          </el-form-item>

          <el-form-item label="参数配置">
            <div class="params-list">
              <el-card
                v-for="(param, pIndex) in skill.parameters"
                :key="param.paramId"
                class="param-card"
                shadow="never"
              >
                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-input
                      :model-value="param.paramId"
                      @update:model-value="updateParameter(sIndex, pIndex, { ...param, paramId: $event })"
                      placeholder="参数 ID"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-input
                      :model-value="param.name"
                      @update:model-value="updateParameter(sIndex, pIndex, { ...param, name: $event })"
                      placeholder="参数名称"
                      size="small"
                    />
                  </el-col>
                  <el-col :span="6">
                    <el-select
                      :model-value="param.type"
                      @update:model-value="updateParameter(sIndex, pIndex, { ...param, type: $event })"
                      size="small"
                    >
                      <el-option label="字符串" value="string" />
                      <el-option label="数字" value="number" />
                      <el-option label="布尔" value="boolean" />
                      <el-option label="对象" value="object" />
                    </el-select>
                  </el-col>
                  <el-col :span="2">
                    <el-button
                      type="danger"
                      link
                      @click="removeParameter(sIndex, pIndex)"
                    >
                      删除
                    </el-button>
                  </el-col>
                </el-row>
                <el-row :gutter="12" style="margin-top: 8px;">
                  <el-col :span="12">
                    <el-checkbox
                      :model-value="param.required"
                      @update:model-value="updateParameter(sIndex, pIndex, { ...param, required: $event })"
                    >
                      必填
                    </el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-input
                      :model-value="param.defaultValue"
                      @update:model-value="updateParameter(sIndex, pIndex, { ...param, defaultValue: $event })"
                      placeholder="默认值"
                      size="small"
                    />
                  </el-col>
                </el-row>
              </el-card>
              <el-button type="primary" link @click="addParameter(sIndex)">
                + 添加参数
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="执行脚本 (JSON)">
            <el-input
              :model-value="skill.executeScript"
              @update:model-value="updateSkill(sIndex, { ...skill, executeScript: $event })"
              type="textarea"
              :rows="3"
              placeholder='{"action":"...","params":{...}}'
            />
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <el-button type="primary" @click="addSkill" class="add-skill-btn">
      + 添加技能
    </el-button>
  </div>
</template>

<style scoped>
.skill-editor {
  padding: 16px;
}

.skill-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.skill-form {
  padding: 16px;
}

.params-list {
  width: 100%;
}

.param-card {
  margin-bottom: 8px;
}

.add-skill-btn {
  margin-top: 16px;
}
</style>
