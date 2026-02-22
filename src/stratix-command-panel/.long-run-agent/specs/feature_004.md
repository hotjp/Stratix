# Feature 004: 指令日志展示

## 功能概述
展示当前 Agent 最近执行的指令记录（状态、结果、时间），支持指令历史查询和执行结果查看。

## 功能需求

### 1. 日志列表展示
- **展示内容**：
  - 指令 ID（`commandId`）
  - Agent 名称（`agentName`）
  - 技能名称（`skillName`）
  - 执行状态（`status`：pending/running/success/failed）
  - 执行时间（`time`）
  - 执行结果（`result`：可选）
- **展示数量**：最近 10 条指令日志
- **排序方式**：按执行时间倒序（最新的在最上面）

### 2. 状态实时更新
- **监听事件**：`stratix:command_status_update`
- **更新机制**：
  - 接收到事件后，根据 `commandId` 查找对应日志
  - 更新日志的状态（`status`）和结果（`result`）
  - 触发 UI 重新渲染

### 3. 状态视觉设计
- **状态颜色映射**：
  - `pending`：青色（#00FFFF）- 等待执行
  - `running`：黄色（#FFFF00）- 执行中
  - `success`：绿色（#00FF00）- 执行成功
  - `failed`：红色（#FF0000）- 执行失败
- **状态图标**：
  - `pending`：⏳（沙漏）
  - `running`：⚡（闪电）
  - `success`：✓（对勾）
  - `failed`：✗（叉号）

### 4. 日志详情查看
- **触发方式**：点击日志条目
- **展示内容**：
  - 完整的指令参数（格式化 JSON）
  - 执行结果详情（如果执行成功）
  - 错误信息（如果执行失败）
  - 执行耗时（可选）
- **展示方式**：模态对话框或侧边栏

### 5. 日志筛选与搜索（可选）
- **筛选条件**：
  - 按状态筛选（仅显示成功/失败的指令）
  - 按技能筛选（仅显示特定技能的指令）
  - 按时间范围筛选（今天/最近 7 天/最近 30 天）
- **搜索功能**：
  - 支持按指令 ID 搜索
  - 支持按 Agent 名称搜索
  - 支持按技能名称搜索

## 技术实现

### 文件结构
```
src/stratix-command-panel/
├── components/
│   └── CommandLog.vue         # 指令日志组件
└── StratixCommandPanel.ts     # 核心逻辑类
```

### 核心代码（CommandLog.vue）
```vue
<template>
  <div class="command-log">
    <div class="log-header">
      <h3>指令执行日志</h3>
      <div class="log-filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="pending">等待中</option>
          <option value="running">执行中</option>
          <option value="success">执行成功</option>
          <option value="failed">执行失败</option>
        </select>
        
        <input 
          v-model="searchQuery" 
          placeholder="搜索指令..."
          class="search-input"
        />
      </div>
    </div>
    
    <div class="log-body">
      <div 
        v-for="log in filteredLogs"
        :key="log.commandId"
        :class="['log-item', `status-${log.status}`]"
        @click="showLogDetail(log)"
      >
        <div class="log-icon">
          {{ getStatusIcon(log.status) }}
        </div>
        
        <div class="log-content">
          <div class="log-title">
            <span class="skill-name">{{ log.skillName }}</span>
            <span class="agent-name">{{ log.agentName }}</span>
          </div>
          
          <div class="log-meta">
            <span class="log-time">{{ log.time }}</span>
            <span :class="['log-status', log.status]">
              {{ getStatusText(log.status) }}
            </span>
          </div>
        </div>
        
        <div class="log-actions">
          <button 
            v-if="log.status === 'running'"
            @click.stop="cancelCommand(log.commandId)"
            class="cancel-btn"
          >
            取消
          </button>
        </div>
      </div>
      
      <div v-if="filteredLogs.length === 0" class="empty-state">
        暂无指令日志
      </div>
    </div>
    
    <!-- 日志详情对话框 -->
    <div v-if="selectedLog" class="log-detail-modal" @click="closeLogDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>指令详情</h3>
          <button @click="closeLogDetail" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-item">
            <label>指令 ID：</label>
            <span>{{ selectedLog.commandId }}</span>
          </div>
          
          <div class="detail-item">
            <label>Agent：</label>
            <span>{{ selectedLog.agentName }}</span>
          </div>
          
          <div class="detail-item">
            <label>技能：</label>
            <span>{{ selectedLog.skillName }}</span>
          </div>
          
          <div class="detail-item">
            <label>状态：</label>
            <span :class="['log-status', selectedLog.status]">
              {{ getStatusText(selectedLog.status) }}
            </span>
          </div>
          
          <div class="detail-item">
            <label>执行时间：</label>
            <span>{{ selectedLog.time }}</span>
          </div>
          
          <div class="detail-item">
            <label>指令参数：</label>
            <pre class="code-block">{{ formatParams(selectedLog.params) }}</pre>
          </div>
          
          <div v-if="selectedLog.result" class="detail-item">
            <label>执行结果：</label>
            <pre class="code-block">{{ selectedLog.result }}</pre>
          </div>
          
          <div v-if="selectedLog.error" class="detail-item">
            <label>错误信息：</label>
            <pre class="code-block error">{{ selectedLog.error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { StratixStateSyncEvent } from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';

interface CommandLog {
  commandId: string;
  agentId: string;
  agentName: string;
  skillName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  time: string;
  params: Record<string, any>;
  result?: string;
  error?: string;
}

const logs = ref<CommandLog[]>([]);
const selectedLog = ref<CommandLog | null>(null);
const statusFilter = ref<string>('');
const searchQuery = ref<string>('');

const filteredLogs = computed(() => {
  let result = logs.value;
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(log => log.status === statusFilter.value);
  }
  
  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(log =>
      log.commandId.toLowerCase().includes(query) ||
      log.agentName.toLowerCase().includes(query) ||
      log.skillName.toLowerCase().includes(query)
    );
  }
  
  return result;
});

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    pending: '⏳',
    running: '⚡',
    success: '✓',
    failed: '✗'
  };
  return icons[status] || '?';
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: '等待中',
    running: '执行中',
    success: '执行成功',
    failed: '执行失败'
  };
  return texts[status] || '未知';
};

const showLogDetail = (log: CommandLog) => {
  selectedLog.value = log;
};

const closeLogDetail = () => {
  selectedLog.value = null;
};

const formatParams = (params: Record<string, any>): string => {
  return JSON.stringify(params, null, 2);
};

const cancelCommand = (commandId: string) => {
  emit('cancel', commandId);
};

const addLog = (log: CommandLog) => {
  logs.value.unshift(log);
  if (logs.value.length > 10) {
    logs.value.pop();
  }
};

const updateLogStatus = (commandId: string, status: string, result?: string, error?: string) => {
  const log = logs.value.find(l => l.commandId === commandId);
  if (log) {
    log.status = status as any;
    if (result) log.result = result;
    if (error) log.error = error;
  }
};

onMounted(() => {
  // 订阅指令状态更新事件
  StratixEventBus.subscribe(
    'stratix:command_status_update',
    (event: StratixStateSyncEvent) => {
      const { commandId, commandStatus, result, error } = event.payload;
      updateLogStatus(commandId!, commandStatus!, result, error);
    }
  );
});

const emit = defineEmits<{
  (e: 'cancel', commandId: string): void;
}>();

defineExpose({
  addLog,
  updateLogStatus
});
</script>

<style scoped>
.command-log {
  width: 100%;
  max-height: 400px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.log-header h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: bold;
}

.log-filters {
  display: flex;
  gap: 8px;
}

.filter-select,
.search-input {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.filter-select {
  width: 120px;
}

.search-input {
  flex: 1;
}

.log-body {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.log-item:hover {
  background: #f5f5f5;
}

.log-item.status-pending {
  border-left-color: #00FFFF;
}

.log-item.status-running {
  border-left-color: #FFFF00;
}

.log-item.status-success {
  border-left-color: #00FF00;
}

.log-item.status-failed {
  border-left-color: #FF0000;
}

.log-icon {
  font-size: 20px;
  margin-right: 12px;
}

.log-content {
  flex: 1;
}

.log-title {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.skill-name {
  font-weight: bold;
  font-size: 13px;
}

.agent-name {
  color: #666;
  font-size: 12px;
}

.log-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #999;
}

.log-status {
  font-weight: bold;
}

.log-status.pending {
  color: #00FFFF;
}

.log-status.running {
  color: #FFFF00;
}

.log-status.success {
  color: #00FF00;
}

.log-status.failed {
  color: #FF0000;
}

.cancel-btn {
  padding: 4px 12px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #cc0000;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* 模态对话框 */
.log-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 16px;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  display: block;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
  color: #666;
}

.detail-item span {
  font-size: 14px;
}

.code-block {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

.code-block.error {
  background: #ffebee;
  color: #c62828;
}
</style>
```

### 核心逻辑（StratixCommandPanel.ts 更新）
```typescript
// 在 StratixCommandPanel 类中添加以下方法

/**
 * 添加指令执行日志
 * @param command 指令数据
 * @param skillName 技能名称
 */
private addCommandLog(command: StratixCommandData, skillName: string): void {
  const log: CommandLog = {
    commandId: command.commandId,
    agentId: command.agentId,
    agentName: this.getAgentName(command.agentId),
    skillName,
    status: 'pending',
    time: new Date().toLocaleTimeString(),
    params: command.params
  };
  
  // 调用 CommandLog 组件的 addLog 方法
  // this.commandLogComponent.addLog(log);
  
  console.log('添加指令日志:', log);
}

/**
 * 订阅指令状态更新事件
 */
private subscribeStratixEvents(): void {
  // 订阅 Agent 选择事件
  this.stratixEventBus.subscribe(
    'stratix:agent_select',
    (event: StratixFrontendOperationEvent) => {
      this.selectedAgentIds = event.payload.agentIds || [];
      this.loadAgentSkills();
    }
  );

  // 订阅指令状态更新事件
  this.stratixEventBus.subscribe(
    'stratix:command_status_update',
    (event: StratixStateSyncEvent) => {
      this.updateCommandLog(event);
    }
  );
}

/**
 * 更新指令日志状态
 * @param event 状态更新事件
 */
private updateCommandLog(event: StratixStateSyncEvent): void {
  const { commandId, commandStatus, data } = event.payload;
  
  // 调用 CommandLog 组件的 updateLogStatus 方法
  // this.commandLogComponent.updateLogStatus(
  //   commandId,
  //   commandStatus,
  //   data?.result,
  //   data?.error
  // );
  
  console.log('更新指令日志状态:', commandId, commandStatus);
}

/**
 * 获取 Agent 名称（从配置中）
 * @param agentId Agent ID
 * @returns Agent 名称
 */
private getAgentName(agentId: string): string {
  // TODO: 从 Agent 配置中获取名称
  return agentId;
}
```

## 测试用例

### 1. 日志添加测试
- **输入**：提交一个新指令
- **预期**：
  - 日志列表顶部新增一条日志
  - 状态为 `pending`
  - 显示技能名称和 Agent 名称

### 2. 状态更新测试
- **输入**：接收到 `stratix:command_status_update` 事件
- **预期**：
  - 对应日志的状态更新
  - 显示执行结果或错误信息
  - 状态颜色正确显示

### 3. 日志筛选测试
- **输入**：选择状态筛选为"执行成功"
- **预期**：仅显示状态为 `success` 的日志

### 4. 日志搜索测试
- **输入**：在搜索框输入"文案"
- **预期**：仅显示技能名称或 Agent 名称包含"文案"的日志

### 5. 日志详情查看测试
- **输入**：点击日志条目
- **预期**：
  - 弹出模态对话框
  - 显示完整的指令参数和执行结果

## 验收标准
- [ ] 正确展示指令执行日志
- [ ] 日志状态实时更新
- [ ] 状态颜色和图标正确显示
- [ ] 支持日志筛选和搜索
- [ ] 点击日志可查看详情
- [ ] 日志列表最多显示 10 条

## 依赖
- `stratix-protocol.ts`：数据类型定义
- `StratixEventBus`：事件总线
- Vue 3：前端框架

## 预估工时
- **开发时间**：2 天
- **测试时间**：1 天
- **总计**：3 天

## 备注
- 日志数据可持久化存储（localStorage）
- 支持日志导出功能（可选）
- 支持日志清空功能（可选）
