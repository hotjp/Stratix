# Feature 002: 参数表单编辑

## 功能概述
根据选中的技能，动态生成参数表单，支持用户输入/选择指令参数，并进行参数校验。

## 功能需求

### 1. 动态表单生成
- **触发条件**：接收来自 SkillList 组件的 `skill-selected` 事件
- **数据源**：`StratixSkillConfig.parameters` 数组
- **表单项类型映射**：
  - `string` → 文本输入框（Input）
  - `number` → 数字输入框（InputNumber）
  - `boolean` → 开关（Switch）
  - `enum` → 下拉选择（Select）
  - `array` → 多选框（CheckboxGroup）或标签输入（TagInput）

### 2. 参数类型与表单组件映射

#### 2.1 文本类型（string）
- **组件**：`<input type="text">` 或 `<textarea>`
- **属性**：
  - 必填项：required 标记
  - 默认值：`defaultValue`
  - 占位符：参数描述
  - 多行文本：当参数名包含 "content" 或 "text" 时，使用 textarea

#### 2.2 数字类型（number）
- **组件**：`<input type="number">` 或 `<InputNumber>`
- **属性**：
  - 最小值：可选
  - 最大值：可选
  - 步长：默认为 1
  - 默认值：`defaultValue`

#### 2.3 布尔类型（boolean）
- **组件**：`<Switch>` 或 `<Checkbox>`
- **属性**：
  - 默认值：`defaultValue` (true/false)

#### 2.4 枚举类型（enum）
- **组件**：`<Select>` 或 `<RadioGroup>`
- **属性**：
  - 选项列表：`enumValues`（需在参数定义中扩展）
  - 默认值：`defaultValue`

### 3. 参数校验
- **必填校验**：`required: true` 的参数不能为空
- **类型校验**：
  - `string`：非空字符串（如果 required）
  - `number`：数字类型，符合 min/max 范围
  - `enum`：选项必须在 enumValues 列表中
- **自定义校验**：支持正则表达式或校验函数（可选）
- **错误提示**：实时显示校验错误信息

### 4. 表单交互
- **实时预览**：输入参数时，实时显示指令预览（可选）
- **参数重置**：点击"重置"按钮，恢复默认值
- **参数保存**：保存当前技能的参数配置（可选）
- **快捷输入**：支持历史参数快速选择（可选）

### 5. 视觉设计
- **布局**：垂直排列，每个参数一行
- **标签样式**：
  - 参数名：加粗，14px
  - 必填标记：红色星号 (*)
  - 参数描述：灰色小字，12px
- **输入框样式**：
  - 正常状态：白色背景，灰色边框
  - 聚焦状态：蓝色边框
  - 错误状态：红色边框 + 错误提示

## 技术实现

### 文件结构
```
src/stratix-command-panel/
├── components/
│   └── ParamForm.vue          # 参数表单组件
└── utils/
    └── ParamValidator.ts      # 参数校验工具
```

### 核心代码（ParamForm.vue）
```vue
<template>
  <div class="param-form">
    <div class="form-header">
      <h3>{{ skillName }} - 参数配置</h3>
      <button @click="resetForm" class="reset-btn">重置</button>
    </div>
    
    <div class="form-body">
      <div 
        v-for="param in parameters"
        :key="param.paramId"
        class="form-item"
      >
        <label class="param-label">
          <span class="param-name">{{ param.name }}</span>
          <span v-if="param.required" class="required-mark">*</span>
          <span class="param-desc">{{ param.description }}</span>
        </label>
        
        <!-- 文本类型 -->
        <input
          v-if="param.type === 'string' && !isMultiline(param)"
          v-model="formData[param.paramId]"
          type="text"
          :placeholder="param.description"
          :required="param.required"
          class="form-input"
          @blur="validateParam(param)"
        />
        
        <!-- 多行文本 -->
        <textarea
          v-if="param.type === 'string' && isMultiline(param)"
          v-model="formData[param.paramId]"
          :placeholder="param.description"
          :required="param.required"
          class="form-textarea"
          rows="4"
          @blur="validateParam(param)"
        />
        
        <!-- 数字类型 -->
        <input
          v-if="param.type === 'number'"
          v-model.number="formData[param.paramId]"
          type="number"
          :min="param.min"
          :max="param.max"
          :placeholder="param.description"
          :required="param.required"
          class="form-input"
          @blur="validateParam(param)"
        />
        
        <!-- 布尔类型 -->
        <label v-if="param.type === 'boolean'" class="switch-label">
          <input
            v-model="formData[param.paramId]"
            type="checkbox"
            class="form-switch"
          />
          <span>{{ formData[param.paramId] ? '启用' : '禁用' }}</span>
        </label>
        
        <!-- 枚举类型 -->
        <select
          v-if="param.type === 'enum'"
          v-model="formData[param.paramId]"
          :required="param.required"
          class="form-select"
          @change="validateParam(param)"
        >
          <option value="">请选择</option>
          <option 
            v-for="option in param.enumValues" 
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        
        <!-- 错误提示 -->
        <div v-if="errors[param.paramId]" class="error-message">
          {{ errors[param.paramId] }}
        </div>
      </div>
    </div>
    
    <div class="form-footer">
      <button 
        @click="submitForm"
        :disabled="!isFormValid"
        class="submit-btn"
      >
        执行指令
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { StratixSkillConfig, StratixSkillParameter } from '@/stratix-core/stratix-protocol';
import ParamValidator from '../utils/ParamValidator';

interface Props {
  skill: StratixSkillConfig;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'submit', params: Record<string, any>): void;
}>();

const skillName = computed(() => props.skill.name);
const parameters = computed(() => props.skill.parameters);

const formData = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0 &&
         parameters.value.every(p => 
           !p.required || formData.value[p.paramId] !== undefined
         );
});

const isMultiline = (param: StratixSkillParameter): boolean => {
  return param.paramId.toLowerCase().includes('content') ||
         param.paramId.toLowerCase().includes('text');
};

const validateParam = (param: StratixSkillParameter) => {
  const value = formData.value[param.paramId];
  const error = ParamValidator.validate(value, param);
  
  if (error) {
    errors.value[param.paramId] = error;
  } else {
    delete errors.value[param.paramId];
  }
};

const resetForm = () => {
  parameters.value.forEach(param => {
    formData.value[param.paramId] = param.defaultValue;
  });
  errors.value = {};
};

const submitForm = () => {
  parameters.value.forEach(p => validateParam(p));
  
  if (isFormValid.value) {
    emit('submit', { ...formData.value });
  }
};

watch(() => props.skill, () => {
  resetForm();
}, { immediate: true });
</script>

<style scoped>
.param-form {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.form-header h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.reset-btn {
  padding: 4px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #e8e8e8;
}

.form-item {
  margin-bottom: 16px;
}

.param-label {
  display: block;
  margin-bottom: 8px;
}

.param-name {
  font-weight: bold;
  font-size: 14px;
  margin-right: 4px;
}

.required-mark {
  color: #ff0000;
  font-weight: bold;
}

.param-desc {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #4A90E2;
  outline: none;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.form-switch {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.error-message {
  color: #ff0000;
  font-size: 12px;
  margin-top: 4px;
}

.form-footer {
  margin-top: 20px;
  text-align: right;
}

.submit-btn {
  padding: 8px 24px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #357ABD;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

### 参数校验工具（ParamValidator.ts）
```typescript
import { StratixSkillParameter } from '@/stratix-core/stratix-protocol';

export default class ParamValidator {
  /**
   * 校验参数值
   * @param value 参数值
   * @param param 参数配置
   * @returns 错误信息（无错误返回 null）
   */
  static validate(value: any, param: StratixSkillParameter): string | null {
    // 必填校验
    if (param.required && (value === undefined || value === null || value === '')) {
      return `${param.name} 不能为空`;
    }

    // 类型校验
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string' && value !== undefined) {
          return `${param.name} 必须是文本类型`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' && value !== undefined) {
          return `${param.name} 必须是数字`;
        }
        if (param.min !== undefined && value < param.min) {
          return `${param.name} 不能小于 ${param.min}`;
        }
        if (param.max !== undefined && value > param.max) {
          return `${param.name} 不能大于 ${param.max}`;
        }
        break;

      case 'enum':
        if (param.enumValues && !param.enumValues.find(e => e.value === value)) {
          return `${param.name} 的值无效`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== undefined) {
          return `${param.name} 必须是布尔值`;
        }
        break;
    }

    return null;
  }

  /**
   * 批量校验参数
   * @param params 参数对象
   * @param paramConfigs 参数配置列表
   * @returns 错误信息映射（paramId → errorMsg）
   */
  static validateAll(
    params: Record<string, any>,
    paramConfigs: StratixSkillParameter[]
  ): Record<string, string> {
    const errors: Record<string, string> = {};
    
    paramConfigs.forEach(config => {
      const error = this.validate(params[config.paramId], config);
      if (error) {
        errors[config.paramId] = error;
      }
    });

    return errors;
  }
}
```

## 测试用例

### 1. 文本参数测试
- **输入**：参数类型为 `string`，必填
- **预期**：
  - 空输入时显示错误提示
  - 输入任意文本后校验通过

### 2. 数字参数测试
- **输入**：参数类型为 `number`，min=1，max=100
- **预期**：
  - 输入 "0" 显示 "不能小于 1"
  - 输入 "101" 显示 "不能大于 100"
  - 输入 "50" 校验通过

### 3. 枚举参数测试
- **输入**：参数类型为 `enum`，选项为 ["正式", "活泼"]
- **预期**：
  - 下拉框展示 "正式" 和 "活泼" 选项
  - 选择 "正式" 后校验通过

### 4. 动态表单生成测试
- **输入**：切换技能（从"快速写文案"到"文案优化"）
- **预期**：
  - 表单参数项自动更新
  - 默认值自动填充

### 5. 表单提交测试
- **输入**：填写所有必填参数，点击"执行指令"
- **预期**：
  - 触发 `submit` 事件
  - 携带完整参数对象

## 验收标准
- [ ] 根据技能参数配置动态生成表单
- [ ] 支持多种参数类型（string/number/boolean/enum）
- [ ] 实时校验参数有效性
- [ ] 显示清晰的错误提示
- [ ] 表单提交前进行完整校验
- [ ] 支持参数重置功能

## 依赖
- `stratix-protocol.ts`：参数类型定义
- Vue 3：前端框架
- Element Plus / Ant Design：UI 组件（可选）

## 预估工时
- **开发时间**：3 天
- **测试时间**：1 天
- **总计**：4 天

## 备注
- 参数类型定义需扩展 `enumValues` 字段
- 支持参数联动（如选择某个选项后，显示/隐藏其他参数）
- 支持参数模板保存功能（可选）
