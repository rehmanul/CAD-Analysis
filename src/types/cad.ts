export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  layer: string;
  material?: string;
}

export interface Door {
  id: string;
  position: Point;
  width: number;
  height: number;
  swing: 'in' | 'out' | 'sliding';
  angle: number;
}

export interface Window {
  id: string;
  position: Point;
  width: number;
  height: number;
  sillHeight: number;
}

export interface RestrictedArea {
  id: string;
  bounds: Point[];
  type: 'NO_ENTRY' | 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL';
  description?: string;
}

export interface FloorPlan {
  id: string;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  restrictedAreas: RestrictedArea[];
  bounds: Point[];
  scale: number;
  unit: 'mm' | 'cm' | 'm' | 'ft' | 'in';
  totalArea: number;
  usableArea: number;
}

export interface Ilot {
  id: string;
  position: Point;
  width: number;
  height: number;
  area: number;
  type: 'small' | 'medium' | 'large' | 'custom';
  rotation: number;
  clearance: number;
  accessibility: boolean;
}

export interface Corridor {
  id: string;
  path: Point[];
  width: number;
  type: 'main' | 'secondary' | 'emergency';
  length: number;
  accessibility: boolean;
}

export interface OptimizationResult {
  spaceUtilization: number;
  accessibilityScore: number;
  clearanceCompliance: number;
  totalIlots: number;
  totalCorridorLength: number;
  efficiency: number;
}

export interface CADAnalysisResult {
  floorPlan: FloorPlan;
  ilots: Ilot[];
  corridors: Corridor[];
  optimization: OptimizationResult;
  exportData: {
    dxf: string;
    pdf: Blob;
    json: string;
    summary: string;
  };
}