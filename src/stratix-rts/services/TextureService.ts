import type { CharacterData, CharacterTexture } from '@/stratix-core/stratix-protocol';
import { characterComposer } from '@/stratix-character-creator/core/CharacterComposer';
import {
  FRAME_SIZE,
  SHEET_WIDTH,
  ANIMATION_OFFSETS
} from '@/stratix-character-creator/constants';

const RTS_ANIMATIONS = ['walk', 'idle', 'run'];

class TextureService {
  private textureCache: Map<string, HTMLCanvasElement> = new Map();

  async generateAndUploadTexture(characterData: CharacterData): Promise<CharacterTexture | null> {
    try {
      const result = await characterComposer.composeCharacter(
        characterData.parts,
        {
          bodyType: characterData.bodyType as any,
          animations: RTS_ANIMATIONS
        }
      );

      const canvas = result.canvas;
      const imageData = canvas.toDataURL('image/png');
      
      const filename = `${characterData.characterId}.png`;
      
      const response = await fetch('/api/stratix/texture/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: characterData.characterId,
          imageData,
          filename
        })
      });

      const json = await response.json();
      
      if (json.code === 200 && json.data) {
        this.textureCache.set(characterData.characterId, canvas);
        
        return {
          filePath: json.data.filePath,
          width: canvas.width,
          height: canvas.height,
          animations: RTS_ANIMATIONS,
          generatedAt: json.data.generatedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('[TextureService] Failed to generate texture:', error);
      return null;
    }
  }

  async checkTexture(filePath: string): Promise<{ exists: boolean; url: string | null }> {
    try {
      const response = await fetch(`/api/stratix/texture/check/${filePath}`);
      const json = await response.json();
      
      if (json.code === 200 && json.data) {
        return {
          exists: json.data.exists,
          url: json.data.url
        };
      }
      
      return { exists: false, url: null };
    } catch (error) {
      console.error('[TextureService] Failed to check texture:', error);
      return { exists: false, url: null };
    }
  }

  async ensureTexture(characterData: CharacterData): Promise<string | null> {
    if (characterData.texture?.filePath) {
      const { exists, url } = await this.checkTexture(characterData.texture.filePath);
      if (exists && url) {
        return url;
      }
    }

    const texture = await this.generateAndUploadTexture(characterData);
    if (texture) {
      return `/textures/${texture.filePath}`;
    }
    
    return null;
  }

  generateRTSTextureUrl(characterId: string): string {
    return `/textures/${characterId}.png`;
  }

  extractAnimationFrame(
    canvas: HTMLCanvasElement,
    animation: string,
    frame: number,
    direction: number
  ): HTMLCanvasElement | null {
    const yPos = ANIMATION_OFFSETS[animation];
    if (yPos === undefined) return null;

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = FRAME_SIZE;
    frameCanvas.height = FRAME_SIZE;

    const ctx = frameCanvas.getContext('2d');
    if (!ctx) return null;

    const srcX = frame * FRAME_SIZE;
    const srcY = yPos + direction * FRAME_SIZE;

    ctx.drawImage(
      canvas,
      srcX, srcY, FRAME_SIZE, FRAME_SIZE,
      0, 0, FRAME_SIZE, FRAME_SIZE
    );

    return frameCanvas;
  }

  getCachedCanvas(characterId: string): HTMLCanvasElement | undefined {
    return this.textureCache.get(characterId);
  }

  clearCache(): void {
    this.textureCache.clear();
  }
}

export const textureService = new TextureService();
export default TextureService;
