import { FsmData, FsmState } from '@/types/fsm';
import React, { useEffect, useRef } from 'react';

//#region ——— Types & Constants ————————————————————————————————————————

interface Props {
  /** Complete FSM definition */
  fsmData: FsmData;
  /** Canvas width (px). Default: 1000 */
  width?: number;
  /** Canvas height (px). Default: 800 */
  height?: number;
}

/**
 * Basic drawing constants — tweak to adjust spacing / sizes.
 */
const NODE_WIDTH = 160;
const NODE_HEIGHT = 70;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 60;
const NODE_RADIUS = 8;
const FONT_FAMILY = '14px sans-serif';

//#endregion

//#region ——— Helper Algorithms ————————————————————————————————————————

/**
 * Performs a BFS from the start node to assign each state a "level" (row).
 * Any unreachable states are appended to the last level so they still render.
 */
const buildLevels = (data: FsmData): Map<number, string[]> => {
  const levels = new Map<number, string[]>();
  if (!data.startStateId) return levels;

  const visited = new Set<string>();
  let frontier: string[] = [data.startStateId];
  let level = 0;

  while (frontier.length) {
    levels.set(level, [...frontier]);
    const next: string[] = [];
    for (const stateId of frontier) {
      visited.add(stateId);
      const state = data.states[stateId];
      state?.transitions.forEach(t => {
        if (!visited.has(t.targetStateId)) next.push(t.targetStateId);
      });
    }
    frontier = next;
    level += 1;
  }

  // Append unreachable states
  const remainder = Object.keys(data.states).filter(id => !visited.has(id));
  if (remainder.length) {
    levels.set(level, remainder);
  }
  return levels;
};

/** Coordinates for a node on the canvas */
interface NodePosition {
  x: number;
  y: number;
}

/**
 * Calculates x/y coordinates for each node based on its level & index.
 */
const computePositions = (
  levels: Map<number, string[]>,
  canvasWidth: number
): Map<string, NodePosition> => {
  const positions = new Map<string, NodePosition>();
  levels.forEach((ids, level) => {
    const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * HORIZONTAL_SPACING;
    const startX = (canvasWidth - totalWidth) / 2;
    ids.forEach((id, idx) => {
      const x = startX + idx * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = VERTICAL_SPACING + level * (NODE_HEIGHT + VERTICAL_SPACING);
      positions.set(id, { x, y });
    });
  });
  return positions;
};

//#endregion

//#region ——— Drawing Primitives ————————————————————————————————————————

const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
};

const drawNode = (ctx: CanvasRenderingContext2D, state: FsmState, pos: NodePosition) => {
  // Node background
  ctx.beginPath();
  ctx.roundRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
  ctx.fillStyle = state.isStartState ? '#E6DCFF' : '#f0f0f0';
  ctx.fill();
  // Border
  ctx.lineWidth = 2;
  ctx.strokeStyle = state.price ? '#ff8c00' : '#333';
  ctx.stroke();

  // Text — name
  ctx.fillStyle = '#000';
  ctx.font = FONT_FAMILY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.name, pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2);

  // Price tag (if any)
  if (state.price !== undefined) {
    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`₿${state.price}`, pos.x + NODE_WIDTH - 6, pos.y + NODE_HEIGHT - 10);
  }

  if (state.isEndState) {
    ctx.font = '16px sans-serif'; // a bit larger so the emoji is crisp
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // small padding inside the node (adjust to taste)
    ctx.fillText('🏁', pos.x + 6, pos.y + 6);
  }
};

const drawArrow = (ctx: CanvasRenderingContext2D, from: NodePosition, to: NodePosition) => {
  // Start at bottom‑center of from node, end at top‑center of to node.
  const startX = from.x + NODE_WIDTH / 2;
  const startY = from.y + NODE_HEIGHT;
  const endX = to.x + NODE_WIDTH / 2;
  const endY = to.y;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#555';
  ctx.stroke();

  // Arrowhead
  const headLength = 8;
  const angle = Math.atan2(endY - startY, endX - startX);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = '#555';
  ctx.fill();
};

//#endregion

//#region ——— Component ——————————————————————————————————————————————

/**
 * <FsmCanvas />
 * Renders a visual map of an FSM onto a <canvas> element, highlighting priced
 * states and clearly laying out the branching structure.
 */
const FsmCanvas: React.FC<Props> = ({ fsmData, width = 1000, height = 800 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Layout calculations
    const levels = buildLevels(fsmData);
    const positions = computePositions(levels, width);

    // Resize canvas height dynamically if needed
    const requiredHeight = (levels.size + 1) * (NODE_HEIGHT + VERTICAL_SPACING);
    if (canvasRef.current.height !== requiredHeight) {
      canvasRef.current.height = requiredHeight;
    }

    // Draw
    clearCanvas(ctx, width, canvasRef.current.height);

    // Draw lines first so they appear below nodes
    for (const stateId in fsmData.states) {
      const state = fsmData.states[stateId];
      const fromPos = positions.get(stateId);
      if (!fromPos) continue;
      state.transitions.forEach(t => {
        const toPos = positions.get(t.targetStateId);
        if (toPos) drawArrow(ctx, fromPos, toPos);
      });
    }

    // Draw nodes on top
    for (const stateId in fsmData.states) {
      const state = fsmData.states[stateId];
      const pos = positions.get(stateId);
      if (pos) drawNode(ctx, state, pos);
    }
  }, [fsmData, width]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', background: '#fff' }}
      />
    </div>
  );
};

export default FsmCanvas;
