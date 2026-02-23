<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { createCharacterCreator } from '../stratix-character-creator';
import type { SavedCharacter } from '../stratix-character-creator/types';
import { StratixEventBus } from '../stratix-core';

const props = defineProps<{
  visible: boolean;
  editCharacterId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', character: SavedCharacter): void;
  (e: 'updated', character: SavedCharacter): void;
  (e: 'deleted', characterId: string): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const game = ref<Phaser.Game | null>(null);
const eventBus = StratixEventBus.getInstance();

const initGame = () => {
  if (!containerRef.value || game.value) return;

  game.value = createCharacterCreator({
    parent: containerRef.value,
    width: containerRef.value.clientWidth || 1200,
    height: containerRef.value.clientHeight || 800,
    targetCharacterId: props.editCharacterId,
    onCharacterCreated: (character: SavedCharacter) => {
      emit('created', character);
    },
    onCharacterUpdated: (character: SavedCharacter) => {
      emit('updated', character);
    },
    onCharacterDeleted: (characterId: string) => {
      emit('deleted', characterId);
    }
  });
};

const destroyGame = () => {
  if (game.value) {
    game.value.destroy(true);
    game.value = null;
  }
};

watch(() => props.visible, (visible) => {
  if (visible) {
    setTimeout(initGame, 100);
  } else {
    destroyGame();
  }
});

onMounted(() => {
  if (props.visible) {
    setTimeout(initGame, 100);
  }
});

onUnmounted(() => {
  destroyGame();
});

const handleClose = () => {
  emit('close');
};

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="visible" 
        class="character-creator-modal" 
        @click="handleBackdropClick"
      >
        <div class="modal-content">
          <header class="modal-header">
            <h2>🎭 角色创建器</h2>
            <button class="close-btn" @click="handleClose" title="关闭">
              ✕
            </button>
          </header>
          <div class="modal-body" ref="containerRef"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.character-creator-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 900px;
  background: #0f0f1a;
  border-radius: 12px;
  border: 1px solid #2a2a4e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid #2a2a4e;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #888;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  background: #0f0f1a;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
