export type CommandType = 
  | 'move' 
  | 'attack' 
  | 'attackMove' 
  | 'stop' 
  | 'patrol'
  | 'holdPosition'
  | 'gather';

export interface MoveCommand {
  type: 'move';
  targetX: number;
  targetY: number;
}

export interface AttackCommand {
  type: 'attack';
  targetId: string;
  targetX: number;
  targetY: number;
}

export interface AttackMoveCommand {
  type: 'attackMove';
  targetX: number;
  targetY: number;
}

export interface StopCommand {
  type: 'stop';
}

export interface PatrolCommand {
  type: 'patrol';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface HoldPositionCommand {
  type: 'holdPosition';
}

export interface GatherCommand {
  type: 'gather';
  targetId: string;
  targetX: number;
  targetY: number;
}

export type Command = 
  | MoveCommand 
  | AttackCommand 
  | AttackMoveCommand 
  | StopCommand
  | PatrolCommand
  | HoldPositionCommand
  | GatherCommand;

export interface CommandContext {
  selectedAgentIds: Set<string>;
  pointerX: number;
  pointerY: number;
  targetId?: string;
  targetType?: 'agent' | 'resource' | 'building' | 'ground';
}

export class CommandSystem {
  private currentCommandType: CommandType | null = null;
  private patrolStartPoint: { x: number; y: number } | null = null;

  public setCommandType(type: CommandType | null): void {
    this.currentCommandType = type;
    if (type !== 'patrol') {
      this.patrolStartPoint = null;
    }
  }

  public getCommandType(): CommandType | null {
    return this.currentCommandType;
  }

  public isCommandMode(): boolean {
    return this.currentCommandType !== null;
  }

  public createCommand(context: CommandContext): Command | null {
    if (this.currentCommandType === null) {
      return this.createDefaultCommand(context);
    }

    switch (this.currentCommandType) {
      case 'move':
        return this.createMoveCommand(context);
      case 'attack':
        return this.createAttackCommand(context);
      case 'attackMove':
        return this.createAttackMoveCommand(context);
      case 'stop':
        return this.createStopCommand();
      case 'patrol':
        return this.createPatrolCommand(context);
      case 'holdPosition':
        return this.createHoldPositionCommand();
      case 'gather':
        return this.createGatherCommand(context);
      default:
        return null;
    }
  }

  private createDefaultCommand(context: CommandContext): Command | null {
    if (context.targetType === 'agent' && context.targetId) {
      return {
        type: 'attack',
        targetId: context.targetId,
        targetX: context.pointerX,
        targetY: context.pointerY
      };
    }

    return {
      type: 'move',
      targetX: context.pointerX,
      targetY: context.pointerY
    };
  }

  private createMoveCommand(context: CommandContext): MoveCommand {
    this.currentCommandType = null;
    return {
      type: 'move',
      targetX: context.pointerX,
      targetY: context.pointerY
    };
  }

  private createAttackCommand(context: CommandContext): AttackCommand {
    this.currentCommandType = null;
    return {
      type: 'attack',
      targetId: context.targetId || '',
      targetX: context.pointerX,
      targetY: context.pointerY
    };
  }

  private createAttackMoveCommand(context: CommandContext): AttackMoveCommand {
    this.currentCommandType = null;
    return {
      type: 'attackMove',
      targetX: context.pointerX,
      targetY: context.pointerY
    };
  }

  private createStopCommand(): StopCommand {
    this.currentCommandType = null;
    return { type: 'stop' };
  }

  private createPatrolCommand(context: CommandContext): PatrolCommand | null {
    if (!this.patrolStartPoint) {
      this.patrolStartPoint = { x: context.pointerX, y: context.pointerY };
      return null;
    }

    const command: PatrolCommand = {
      type: 'patrol',
      fromX: this.patrolStartPoint.x,
      fromY: this.patrolStartPoint.y,
      toX: context.pointerX,
      toY: context.pointerY
    };

    this.patrolStartPoint = null;
    this.currentCommandType = null;
    return command;
  }

  private createHoldPositionCommand(): HoldPositionCommand {
    this.currentCommandType = null;
    return { type: 'holdPosition' };
  }

  private createGatherCommand(context: CommandContext): GatherCommand | null {
    if (context.targetType !== 'resource' || !context.targetId) {
      this.currentCommandType = null;
      return null;
    }

    this.currentCommandType = null;
    return {
      type: 'gather',
      targetId: context.targetId,
      targetX: context.pointerX,
      targetY: context.pointerY
    };
  }

  public cancelCurrentCommand(): void {
    this.currentCommandType = null;
    this.patrolStartPoint = null;
  }

  public startPatrol(x: number, y: number): void {
    this.patrolStartPoint = { x, y };
  }

  public getPatrolStartPoint(): { x: number; y: number } | null {
    return this.patrolStartPoint;
  }
}
