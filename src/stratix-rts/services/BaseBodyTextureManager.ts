import Phaser from 'phaser';
import type { BodyType } from '@/stratix-core/stratix-protocol';
import { FRAME_SIZE, ANIMATION_OFFSETS } from '@/stratix-character-creator/constants';
import { generateBaseTextureInBrowser } from '../scripts/BaseTextureGenerator';

const RTS_ANIMATION_CONFIGS = [
  { key: 'idle', row: 22, frames: 4, frameRate: 4 },
  { key: 'walk', row: 8, frames: 8, frameRate: 8 },
  { key: 'run', row: 38, frames: 8, frameRate: 10 }
] as const;

const BODY_COLORS: Record<BodyType, { primary: string; secondary: string; outline: string }> = {
  male: { primary: '#4a7c7c', secondary: '#3d6666', outline: '#2d4f4f' },
  female: { primary: '#7c4a7c', secondary: '#663d66', outline: '#4f2d4f' },
  teen: { primary: '#7c7c4a', secondary: '#66663d', outline: '#4f4f2d' },
  muscular: { primary: '#7c4a4a', secondary: '#663d3d', outline: '#4f2d2d' },
  pregnant: { primary: '#4a7c4a', secondary: '#3d663d', outline: '#2d4f2d' },
  child: { primary: '#7c9c7c', secondary: '#668066', outline: '#4f604f' }
};

const BASE_TEXTURE_PATH = '/spritesheets/base/';

class BaseBodyTextureManager {
  private scene: Phaser.Scene | null = null;
  private loadedTextures: Map<BodyType, string> = new Map();
  private loadingPromises: Map<BodyType, Promise<string>> = new Map();

  async initialize(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    await this.preloadAllBaseBodyTextures();
  }

  private async preloadAllBaseBodyTextures(): Promise<void> {
    const bodyTypes: BodyType[] = ['male', 'female', 'teen', 'muscular', 'pregnant', 'child'];
    
    await Promise.all(bodyTypes.map(bodyType => this.loadBaseBodyTexture(bodyType)));
  }

  async loadBaseBodyTexture(bodyType: BodyType): Promise<string> {
    if (this.loadedTextures.has(bodyType)) {
      return this.loadedTextures.get(bodyType)!;
    }

    if (this.loadingPromises.has(bodyType)) {
      return this.loadingPromises.get(bodyType)!;
    }

    const promise = this.doLoadTexture(bodyType);
    this.loadingPromises.set(bodyType, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.loadingPromises.delete(bodyType);
    }
  }

  private async doLoadTexture(bodyType: BodyType): Promise<string> {
    if (!this.scene) {
      throw new Error('BaseBodyTextureManager not initialized');
    }

    const textureKey = `base-body-${bodyType}`;
    
    if (this.scene.textures.exists(textureKey)) {
      this.loadedTextures.set(bodyType, textureKey);
      return textureKey;
    }

    const assetUrl = `${BASE_TEXTURE_PATH}base-${bodyType}.png`;
    
    try {
      await this.loadTextureFromUrl(textureKey, assetUrl);
      this.loadedTextures.set(bodyType, textureKey);
      console.log(`[BaseBodyTextureManager] Loaded from assets: ${bodyType}`);
      return textureKey;
    } catch (error) {
      console.warn(`[BaseBodyTextureManager] Asset not found for ${bodyType}, generating procedurally...`);
      return this.generateBaseBodyTexture(bodyType);
    }
  }

  private loadTextureFromUrl(key: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.scene) {
        reject(new Error('Scene not initialized'));
        return;
      }

      this.scene.load.image(key, url);
      
      this.scene.load.once(`filecomplete-image-${key}`, () => {
        const texture = this.scene!.textures.get(key);
        if (texture) {
          this.createAnimationsForTexture(key);
        }
        resolve();
      });
      
      this.scene.load.once(`loaderror-image-${key}`, () => {
        reject(new Error(`Failed to load texture: ${url}`));
      });
      
      this.scene.load.start();
    });
  }

  private generateBaseBodyTexture(bodyType: BodyType): string {
    if (!this.scene) {
      throw new Error('BaseBodyTextureManager not initialized');
    }

    const textureKey = `base-body-${bodyType}`;
    
    if (this.scene.textures.exists(textureKey)) {
      this.loadedTextures.set(bodyType, textureKey);
      return textureKey;
    }

    const canvas = generateBaseTextureInBrowser(bodyType);
    
    this.scene.textures.addCanvas(textureKey, canvas);
    this.createAnimationsForTexture(textureKey);
    this.loadedTextures.set(bodyType, textureKey);

    console.log(`[BaseBodyTextureManager] Generated procedurally: ${bodyType}`);
    return textureKey;
  }

  private createAnimationsForTexture(textureKey: string): void {
    if (!this.scene) return;

    const texture = this.scene.textures.get(textureKey);
    if (!texture) return;

    const frameWidth = FRAME_SIZE;
    const frameHeight = FRAME_SIZE;

    for (const animConfig of RTS_ANIMATION_CONFIGS) {
      const yPos = ANIMATION_OFFSETS[animConfig.key];
      if (yPos === undefined) continue;

      for (let direction = 0; direction < 4; direction++) {
        const frames: Phaser.Types.Animations.AnimationFrame[] = [];

        for (let f = 0; f < animConfig.frames; f++) {
          const frameName = `${animConfig.key}_${direction}_${f}`;
          texture.add(
            frameName,
            0,
            f * frameWidth,
            yPos + direction * frameHeight,
            frameWidth,
            frameHeight
          );
          frames.push({ key: textureKey, frame: frameName });
        }

        const animKey = `${textureKey}_${animConfig.key}_${direction}`;
        
        if (!this.scene!.anims.exists(animKey)) {
          this.scene!.anims.create({
            key: animKey,
            frames,
            frameRate: animConfig.frameRate,
            repeat: -1
          });
        }
      }
    }
  }

  getBaseBodyTextureKey(bodyType: BodyType): string | null {
    return this.loadedTextures.get(bodyType) ?? null;
  }

  hasTexture(bodyType: BodyType): boolean {
    return this.loadedTextures.has(bodyType);
  }

  destroy(): void {
    this.loadedTextures.clear();
    this.loadingPromises.clear();
    this.scene = null;
  }
}

export const baseBodyTextureManager = new BaseBodyTextureManager();
export default BaseBodyTextureManager;
