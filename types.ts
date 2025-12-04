export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface OrnamentData {
  id: number;
  type: 'box' | 'ball' | 'triangle';
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number]; // Changed to array for non-uniform scaling
  color: string;
}