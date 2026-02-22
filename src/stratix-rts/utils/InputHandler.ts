import Phaser from 'phaser';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';

export interface InputConfig {
  zoomSpeed: number;
  pinchZoomSpeed: number;
  minZoom: number;
  maxZoom: number;
  panSpeed: number;
  trackpadPanSpeed: number;
}

export interface InputCallbacks {
  onSelect?: (agentIds: string[]) => void;
  onDeselect?: () => void;
  onCommand?: (target: { x: number; y: number }) => void;
  onCameraMove?: (deltaX: number, deltaY: number) => void;
  onZoom?: (zoom: number) => void;
  onDragStart?: (x: number, y: number) => void;
  onDragUpdate?: (x: number, y: number) => void;
  onDragEnd?: () => Phaser.Geom.Rectangle | null;
}

const DEFAULT_CONFIG: InputConfig = {
  zoomSpeed: 0.001,
  pinchZoomSpeed: 0.01,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  panSpeed: 4,
  trackpadPanSpeed: 1
};

export class InputHandler {
  private scene: Phaser.Scene;
  private config: InputConfig;
  private callbacks: InputCallbacks;
  private isEnabled: boolean = true;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private isDragging: boolean = false;
  private boundHandlers: {
    pointerdown: (pointer: Phaser.Input.Pointer) => void;
    pointermove: (pointer: Phaser.Input.Pointer) => void;
    pointerup: (pointer: Phaser.Input.Pointer) => void;
    wheel: (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => void;
  };

  constructor(
    scene: Phaser.Scene, 
    callbacks: InputCallbacks, 
    config?: Partial<InputConfig>
  ) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.boundHandlers = {
      pointerdown: this.handlePointerDown.bind(this),
      pointermove: this.handlePointerMove.bind(this),
      pointerup: this.handlePointerUp.bind(this),
      wheel: this.handleWheel.bind(this)
    };
    
    this.initKeyboard();
    this.initMouse();
  }

  private initKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    const escKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    escKey.on('down', () => {
      if (this.isEnabled && this.callbacks.onDeselect) {
        this.callbacks.onDeselect();
      }
    });

    const plusKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PLUS
    );
    const minusKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.MINUS
    );
    
    plusKey.on('down', () => this.zoomCamera(0.1));
    minusKey.on('down', () => this.zoomCamera(-0.1));
  }

  private initMouse(): void {
    this.scene.input.on('pointerdown', this.boundHandlers.pointerdown);
    this.scene.input.on('pointermove', this.boundHandlers.pointermove);
    this.scene.input.on('pointerup', this.boundHandlers.pointerup);
    this.scene.input.on('wheel', this.boundHandlers.wheel);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    if (pointer.leftButtonDown()) {
      this.isDragging = true;
      if (this.callbacks.onDragStart) {
        this.callbacks.onDragStart(pointer.worldX, pointer.worldY);
      }
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    if (this.isDragging && pointer.leftButtonDown()) {
      if (this.callbacks.onDragUpdate) {
        this.callbacks.onDragUpdate(pointer.worldX, pointer.worldY);
      }
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    if (pointer.leftButtonReleased() && this.isDragging) {
      this.isDragging = false;
      if (this.callbacks.onDragEnd) {
        const bounds = this.callbacks.onDragEnd();
        if (!bounds) {
          const hitSprite = this.getSpriteAtPointer(pointer);
          if (hitSprite && this.callbacks.onSelect) {
            this.callbacks.onSelect([hitSprite.getData('agentId')]);
          }
        }
      }
    }

    if (pointer.rightButtonReleased()) {
      if (this.callbacks.onCommand) {
        this.callbacks.onCommand({
          x: pointer.worldX,
          y: pointer.worldY
        });
      }
    }
  }

  private handleWheel(
    pointer: Phaser.Input.Pointer, 
    _gameObjects: Phaser.GameObjects.GameObject[], 
    deltaX: number, 
    deltaY: number
  ): void {
    if (!this.isEnabled) return;
    
    const camera = this.scene.cameras.main;
    const domEvent = pointer.event as WheelEvent | undefined;
    
    const isPinch = domEvent?.ctrlKey === true;
    
    if (isPinch) {
      const currentZoom = camera.zoom;
      const newZoom = Phaser.Math.Clamp(
        currentZoom - deltaY * this.config.pinchZoomSpeed,
        this.config.minZoom,
        this.config.maxZoom
      );
      camera.setZoom(newZoom);
      
      if (this.callbacks.onZoom) {
        this.callbacks.onZoom(newZoom);
      }
      return;
    }
    
    const isTrackpad = Math.abs(deltaX) > 0 || Math.abs(deltaY) < 50;
    
    if (isTrackpad && Math.abs(deltaX) > Math.abs(deltaY) * 0.5) {
      camera.scrollX -= deltaX * this.config.trackpadPanSpeed;
      camera.scrollY -= deltaY * this.config.trackpadPanSpeed;
      
      if (this.callbacks.onCameraMove) {
        this.callbacks.onCameraMove(-deltaX, -deltaY);
      }
      return;
    }
    
    const currentZoom = camera.zoom;
    const newZoom = Phaser.Math.Clamp(
      currentZoom - deltaY * this.config.zoomSpeed,
      this.config.minZoom,
      this.config.maxZoom
    );
    camera.setZoom(newZoom);
    
    if (this.callbacks.onZoom) {
      this.callbacks.onZoom(newZoom);
    }
  }

  private getSpriteAtPointer(pointer: Phaser.Input.Pointer): Phaser.GameObjects.GameObject | null {
    const gameObjects = this.scene.input.hitTestPointer(pointer);
    
    for (const obj of gameObjects) {
      const agentId = obj.getData('agentId');
      if (agentId) {
        return obj;
      }
      
      if (obj.parentContainer) {
        const parentAgentId = obj.parentContainer.getData('agentId');
        if (parentAgentId) {
          return obj.parentContainer;
        }
      }
    }
    
    return null;
  }

  private zoomCamera(delta: number): void {
    const camera = this.scene.cameras.main;
    const newZoom = Phaser.Math.Clamp(
      camera.zoom + delta,
      this.config.minZoom,
      this.config.maxZoom
    );
    camera.setZoom(newZoom);
    
    if (this.callbacks.onZoom) {
      this.callbacks.onZoom(newZoom);
    }
  }

  public update(): void {
    if (!this.isEnabled || !this.cursors) return;

    const camera = this.scene.cameras.main;
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown) moveX = -this.config.panSpeed;
    else if (this.cursors.right.isDown) moveX = this.config.panSpeed;

    if (this.cursors.up.isDown) moveY = -this.config.panSpeed;
    else if (this.cursors.down.isDown) moveY = this.config.panSpeed;

    if (moveX !== 0 || moveY !== 0) {
      camera.scrollX += moveX;
      camera.scrollY += moveY;
      
      if (this.callbacks.onCameraMove) {
        this.callbacks.onCameraMove(moveX, moveY);
      }
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public isInputEnabled(): boolean {
    return this.isEnabled;
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.boundHandlers.pointerdown);
    this.scene.input.off('pointermove', this.boundHandlers.pointermove);
    this.scene.input.off('pointerup', this.boundHandlers.pointerup);
    this.scene.input.off('wheel', this.boundHandlers.wheel);
  }
}
