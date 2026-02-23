<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue';
import { createStratixRTS } from './stratix-rts';
import { StratixEventBus, StratixAgentConfig, StratixFrontendOperationEvent } from './stratix-core';
import MainLayout from './components/MainLayout.vue';
import CharacterCreatorModal from './components/CharacterCreatorModal.vue';
import { WriterHeroTemplate, DevHeroTemplate, AnalystHeroTemplate, generateAgentId } from './stratix-designer';
import type { SavedCharacter } from './stratix-character-creator/types';

const gameContainer = ref<HTMLElement | null>(null);
const isGameReady = ref(false);
const agents = ref<StratixAgentConfig[]>([]);
const selectedAgentIds = ref<string[]>([]);
const currentSkill = ref<any>(null);
const commandLogs = ref<any[]>([]);
const showCharacterCreator = ref(false);
const editCharacterId = ref<string | undefined>(undefined);

let game: Phaser.Game | null = null;
let eventBus: StratixEventBus;

provide('agents', agents);
provide('selectedAgentIds', selectedAgentIds);
provide('currentSkill', currentSkill);
provide('commandLogs', commandLogs);

const handleAgentSelect = (event: StratixFrontendOperationEvent) => {
  selectedAgentIds.value = event.payload.agentIds || [];
};

const handleCommandExecute = async (event: StratixFrontendOperationEvent) => {
  if (!event.payload.command) return;
  
  const log = {
    commandId: event.payload.command.commandId,
    agentId: event.payload.command.agentId,
    skillName: event.payload.skill?.name || 'Unknown',
    status: 'pending' as const,
    time: new Date().toLocaleTimeString(),
    params: event.payload.command.params
  };
  
  commandLogs.value.unshift(log);
  if (commandLogs.value.length > 20) commandLogs.value.pop();

  try {
    const response = await fetch('/api/stratix/command/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.payload.command)
    });
    const result = await response.json();
    
    log.status = result.code === 200 ? 'success' : 'failed';
  } catch (error) {
    log.status = 'failed';
  }
};

const addAgentToRTS = (config: StratixAgentConfig) => {
  if (!game) return;
  const scene = game.scene.getScene('StratixRTSGameScene') as any;
  if (scene) {
    scene.events.emit('stratix:create-agent', config);
  }
};

const selectAgentInRTS = (agentId: string) => {
  if (!game) return;
  const scene = game.scene.getScene('StratixRTSGameScene') as any;
  if (scene) {
    scene.clearSelection();
    scene.selectAgent(agentId);
  }
};

const createAgent = async (type: 'writer' | 'dev' | 'analyst') => {
  const TemplateClass = type === 'writer' ? WriterHeroTemplate 
    : type === 'dev' ? DevHeroTemplate 
    : AnalystHeroTemplate;
  
  const t = new TemplateClass();
  const config = t.getTemplate(generateAgentId(type));
  
  try {
    await fetch('/api/stratix/config/agent/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  } catch (e) {
    console.warn('Failed to save agent:', e);
  }
  
  agents.value.push(config);
  addAgentToRTS(config);
};

const deleteAgent = async (agentId: string) => {
  try {
    await fetch(`/api/stratix/config/agent/delete?agentId=${agentId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('Failed to delete agent:', e);
  }
  
  agents.value = agents.value.filter(a => a.agentId !== agentId);
  selectedAgentIds.value = selectedAgentIds.value.filter(id => id !== agentId);
};

const openCharacterCreator = (characterId?: string) => {
  editCharacterId.value = characterId;
  showCharacterCreator.value = true;
};

const closeCharacterCreator = () => {
  showCharacterCreator.value = false;
  editCharacterId.value = undefined;
};

const handleCharacterCreated = (character: SavedCharacter) => {
  console.log('Character created:', character);
  closeCharacterCreator();
};

const handleCharacterUpdated = (character: SavedCharacter) => {
  console.log('Character updated:', character);
};

const handleCharacterDeleted = (characterId: string) => {
  console.log('Character deleted:', characterId);
};

onMounted(async () => {
  eventBus = StratixEventBus.getInstance();
  
  eventBus.subscribe('stratix:agent_select', handleAgentSelect);
  eventBus.subscribe('stratix:command_execute', handleCommandExecute as any);
  
  try {
    const response = await fetch('/api/stratix/config/agent/list');
    const result = await response.json();
    if (result.code === 200 && result.data) {
      agents.value = result.data;
    }
  } catch (e) {
    console.warn('Failed to load agents from backend:', e);
  }
  
  if (gameContainer.value) {
    game = createStratixRTS({
      parent: gameContainer.value,
      width: gameContainer.value.clientWidth || 800,
      height: gameContainer.value.clientHeight || 600
    });
    
    game.events.on('ready', () => {
      isGameReady.value = true;
      setTimeout(() => {
        agents.value.forEach(config => addAgentToRTS(config));
      }, 100);
    });
    
    if (game.isBooted) {
      isGameReady.value = true;
      setTimeout(() => {
        agents.value.forEach(config => addAgentToRTS(config));
      }, 100);
    }
  }
});

onUnmounted(() => {
  if (eventBus) {
    eventBus.unsubscribe('stratix:agent_select', handleAgentSelect);
    eventBus.unsubscribe('stratix:command_execute', handleCommandExecute as any);
  }
  if (game) {
    game.destroy(true);
  }
});
</script>

<template>
  <MainLayout
    :game-container="gameContainer"
    :is-game-ready="isGameReady"
    :agents="agents"
    :selected-agent-ids="selectedAgentIds"
    :command-logs="commandLogs"
    @create-agent="createAgent"
    @delete-agent="deleteAgent"
    @select-agent="selectAgentInRTS"
    @open-character-creator="openCharacterCreator()"
  >
    <template #game>
      <div ref="gameContainer" class="game-container"></div>
    </template>
  </MainLayout>
  
  <CharacterCreatorModal
    :visible="showCharacterCreator"
    :edit-character-id="editCharacterId"
    @close="closeCharacterCreator"
    @created="handleCharacterCreated"
    @updated="handleCharacterUpdated"
    @deleted="handleCharacterDeleted"
  />
</template>

<style>
.game-container {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
}
</style>
