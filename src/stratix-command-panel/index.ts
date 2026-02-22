/**
 * Stratix Command Panel - 指令面板模块
 * 
 * 负责展示 Agent 技能、编辑指令参数、提交标准化指令
 */

// 导出组件
export { default as SkillList } from './components/SkillList.vue';
export { default as ParamForm } from './components/ParamForm.vue';
export { default as ConfirmDialog } from './components/ConfirmDialog.vue';
export { default as CommandLog } from './components/CommandLog.vue';
export { default as LogDetailModal } from './components/LogDetailModal.vue';
export { default as CancelConfirmDialog } from './components/CancelConfirmDialog.vue';

// 导出工具
export { ParamValidator } from './utils/ParamValidator';
export type { ValidationResult, ParamValidateRule } from './utils/ParamValidator';
export { CommandBuilder } from './utils/CommandBuilder';
export type { CommandBuildOptions, CommandBuildResult } from './utils/CommandBuilder';
