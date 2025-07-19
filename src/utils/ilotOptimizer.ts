import { Point, Ilot, FloorPlan, RestrictedArea } from '../types/cad';
import { v4 as uuidv4 } from 'uuid';

interface IlotSize {
  type: 'small' | 'medium' | 'large';
  width: number;
  height: number;
  area: number;
  minClearance: number;
}

export class IlotOptimizer {
  private floorPlan: FloorPlan;
  private ilotSizes: IlotSize[] = [
    { type: 'small', width: 2000, height: 2500, area: 5000000, minClearance: 800 },
    { type: 'medium', width: 2500, height: 3000, area: 7500000, minClearance: 900 },
    { type: 'large', width: 3000, height: 4000, area: 12000000, minClearance: 1000 }
  ];

  constructor(floorPlan: FloorPlan) {
    this.floorPlan = floorPlan;
  }

  optimizePlacement(maxIterations: number = 1000): Ilot[] {
    const usableAreas = this.calculateUsableAreas();
    let bestConfiguration: Ilot[] = [];
    let bestScore = 0;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const configuration = this.generateRandomConfiguration(usableAreas);
      const score = this.evaluateConfiguration(configuration);

      if (score > bestScore) {
        bestScore = score;
        bestConfiguration = [...configuration];
      }
    }

    return this.refineConfiguration(bestConfiguration);
  }

  private calculateUsableAreas(): Point[][] {
    // Create a grid of the floor plan and mark unusable areas
    const bounds = this.floorPlan.bounds;
    const minX = Math.min(...bounds.map(p => p.x));
    const maxX = Math.max(...bounds.map(p => p.x));
    const minY = Math.min(...bounds.map(p => p.y));
    const maxY = Math.max(...bounds.map(p => p.y));

    const gridSize = 100; // 100mm grid
    const width = Math.ceil((maxX - minX) / gridSize);
    const height = Math.ceil((maxY - minY) / gridSize);
    
    const grid = Array(height).fill(null).map(() => Array(width).fill(true));

    // Mark walls as unusable
    this.floorPlan.walls.forEach(wall => {
      this.markLineInGrid(grid, wall.start, wall.end, wall.thickness, gridSize, minX, minY);
    });

    // Mark restricted areas as unusable
    this.floorPlan.restrictedAreas.forEach(area => {
      this.markPolygonInGrid(grid, area.bounds, gridSize, minX, minY);
    });

    // Convert grid back to usable areas
    return this.gridToPolygons(grid, gridSize, minX, minY);
  }

  private markLineInGrid(
    grid: boolean[][],
    start: Point,
    end: Point,
    thickness: number,
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    const x1 = Math.floor((start.x - offsetX) / gridSize);
    const y1 = Math.floor((start.y - offsetY) / gridSize);
    const x2 = Math.floor((end.x - offsetX) / gridSize);
    const y2 = Math.floor((end.y - offsetY) / gridSize);
    const thicknessCells = Math.ceil(thickness / gridSize);

    // Bresenham's line algorithm with thickness
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      // Mark cells around the line point
      for (let i = -thicknessCells; i <= thicknessCells; i++) {
        for (let j = -thicknessCells; j <= thicknessCells; j++) {
          const nx = x + i;
          const ny = y + j;
          if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
            grid[ny][nx] = false;
          }
        }
      }

      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private markPolygonInGrid(
    grid: boolean[][],
    polygon: Point[],
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const worldX = x * gridSize + offsetX;
        const worldY = y * gridSize + offsetY;
        if (this.pointInPolygon({ x: worldX, y: worldY }, polygon)) {
          grid[y][x] = false;
        }
      }
    }
  }

  private pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x < ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) / (polygon[j].y - polygon[i].y) + polygon[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  private gridToPolygons(grid: boolean[][], gridSize: number, offsetX: number, offsetY: number): Point[][] {
    const areas: Point[][] = [];
    const visited = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(false));

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x] && !visited[y][x]) {
          const area = this.floodFill(grid, visited, x, y, gridSize, offsetX, offsetY);
          if (area.length > 4) { // Only keep significant areas
            areas.push(area);
          }
        }
      }
    }

    return areas;
  }

  private floodFill(
    grid: boolean[][],
    visited: boolean[][],
    startX: number,
    startY: number,
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): Point[] {
    const stack = [{ x: startX, y: startY }];
    const points: Point[] = [];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      if (
        x < 0 || x >= grid[0].length ||
        y < 0 || y >= grid.length ||
        visited[y][x] || !grid[y][x]
      ) {
        continue;
      }

      visited[y][x] = true;
      points.push({
        x: x * gridSize + offsetX,
        y: y * gridSize + offsetY
      });

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    // Convert points to bounding polygon
    if (points.length === 0) return [];

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }

  private generateRandomConfiguration(usableAreas: Point[][]): Ilot[] {
    const ilots: Ilot[] = [];
    
    usableAreas.forEach(area => {
      const areaSize = this.calculatePolygonArea(area);
      const targetIlots = Math.floor(areaSize / 8000000); // One ilot per 8m² for better density
      
      // Create îlot rows for realistic office layout
      const bounds = this.calculateBounds(area);
      const areaWidth = bounds.maxX - bounds.minX;
      const areaHeight = bounds.maxY - bounds.minY;
      
      // Determine layout pattern based on area shape
      if (areaWidth > areaHeight * 1.5) {
        // Wide area - create horizontal rows
        this.createHorizontalRows(area, bounds, ilots, targetIlots);
      } else if (areaHeight > areaWidth * 1.5) {
        // Tall area - create vertical columns
        this.createVerticalColumns(area, bounds, ilots, targetIlots);
      } else {
        // Square-ish area - create grid pattern
        this.createGridPattern(area, bounds, ilots, targetIlots);
      }
    });

    return ilots;
  }

  private createHorizontalRows(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200; // 1.2m corridor
    const ilotSpacing = 600; // 60cm spacing between îlots in same row
    
    const availableHeight = bounds.maxY - bounds.minY;
    const rowHeight = 3000; // 3m per row (2.5m îlot + 0.5m clearance)
    const maxRows = Math.floor(availableHeight / (rowHeight + corridorWidth));
    
    for (let row = 0; row < maxRows && ilots.length < targetIlots; row++) {
      const y = bounds.minY + (row * (rowHeight + corridorWidth)) + rowHeight / 2;
      
      // Place îlots in this row
      const ilotsPerRow = Math.min(4, Math.ceil(targetIlots / maxRows));
      const availableWidth = bounds.maxX - bounds.minX;
      const ilotWidth = Math.min(2500, (availableWidth - (ilotsPerRow - 1) * ilotSpacing) / ilotsPerRow);
      
      for (let col = 0; col < ilotsPerRow && ilots.length < targetIlots; col++) {
        const x = bounds.minX + (col * (ilotWidth + ilotSpacing)) + ilotWidth / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const ilotSize = this.ilotSizes[row % 2]; // Alternate sizes for variety
          ilots.push({
            id: uuidv4(),
            position,
            width: ilotWidth,
            height: ilotSize.height,
            area: ilotWidth * ilotSize.height,
            type: ilotSize.type,
            rotation: 0, // Keep aligned for corridors
            clearance: ilotSize.minClearance,
            accessibility: true
          });
        }
      }
    }
  }

  private createVerticalColumns(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200;
    const ilotSpacing = 600;
    
    const availableWidth = bounds.maxX - bounds.minX;
    const colWidth = 3000;
    const maxCols = Math.floor(availableWidth / (colWidth + corridorWidth));
    
    for (let col = 0; col < maxCols && ilots.length < targetIlots; col++) {
      const x = bounds.minX + (col * (colWidth + corridorWidth)) + colWidth / 2;
      
      const ilotsPerCol = Math.min(4, Math.ceil(targetIlots / maxCols));
      const availableHeight = bounds.maxY - bounds.minY;
      const ilotHeight = Math.min(2500, (availableHeight - (ilotsPerCol - 1) * ilotSpacing) / ilotsPerCol);
      
      for (let row = 0; row < ilotsPerCol && ilots.length < targetIlots; row++) {
        const y = bounds.minY + (row * (ilotHeight + ilotSpacing)) + ilotHeight / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const ilotSize = this.ilotSizes[col % 2];
          ilots.push({
            id: uuidv4(),
            position,
            width: ilotSize.width,
            height: ilotHeight,
            area: ilotSize.width * ilotHeight,
            type: ilotSize.type,
            rotation: 0,
            clearance: ilotSize.minClearance,
            accessibility: true
          });
        }
      }
    }
  }

  private createGridPattern(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200;
    const gridCells = Math.ceil(Math.sqrt(targetIlots));
    
    const cellWidth = (bounds.maxX - bounds.minX) / gridCells;
    const cellHeight = (bounds.maxY - bounds.minY) / gridCells;
    
    for (let row = 0; row < gridCells && ilots.length < targetIlots; row++) {
      for (let col = 0; col < gridCells && ilots.length < targetIlots; col++) {
        const x = bounds.minX + (col * cellWidth) + cellWidth / 2;
        const y = bounds.minY + (row * cellHeight) + cellHeight / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const ilotSize = this.ilotSizes[Math.floor(Math.random() * this.ilotSizes.length)];
          const maxWidth = Math.min(ilotSize.width, cellWidth - corridorWidth);
          const maxHeight = Math.min(ilotSize.height, cellHeight - corridorWidth);
          
          if (maxWidth > 1000 && maxHeight > 1000) { // Minimum viable size
            ilots.push({
              id: uuidv4(),
              position,
              width: maxWidth,
              height: maxHeight,
              area: maxWidth * maxHeight,
              type: ilotSize.type,
              rotation: 0,
              clearance: ilotSize.minClearance,
              accessibility: true
            });
          }
        }
      }
    }
  }

  private getRandomPointInPolygon(polygon: Point[]): Point | null {
    const bounds = this.calculateBounds(polygon);
    const minX = bounds[0].x;
    const maxX = bounds[1].x;
    const minY = bounds[0].y;
    const maxY = bounds[2].y;

    for (let attempts = 0; attempts < 100; attempts++) {
      const point = {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY)
      };

      if (this.pointInPolygon(point, polygon)) {
        return point;
      }
    }

    return null;
  }

  private canPlaceIlot(
    position: Point,
    ilotSize: IlotSize,
    existingIlots: Ilot[],
    area: Point[]
  ): boolean {
    const halfWidth = ilotSize.width / 2;
    const halfHeight = ilotSize.height / 2;

    const corners = [
      { x: position.x - halfWidth, y: position.y - halfHeight },
      { x: position.x + halfWidth, y: position.y - halfHeight },
      { x: position.x + halfWidth, y: position.y + halfHeight },
      { x: position.x - halfWidth, y: position.y + halfHeight }
    ];

    // Check if all corners are within the usable area
    for (const corner of corners) {
      if (!this.pointInPolygon(corner, area)) {
        return false;
      }
    }

    // Check clearance from existing ilots
    for (const existingIlot of existingIlots) {
      const distance = Math.sqrt(
        Math.pow(position.x - existingIlot.position.x, 2) +
        Math.pow(position.y - existingIlot.position.y, 2)
      );

      const requiredClearance = Math.max(ilotSize.minClearance, existingIlot.clearance);
      if (distance < requiredClearance) {
        return false;
      }
    }

    return true;
  }

  private evaluateConfiguration(ilots: Ilot[]): number {
    const spaceUtilization = this.calculateSpaceUtilization(ilots);
    const accessibilityScore = this.calculateAccessibilityScore(ilots);
    const clearanceScore = this.calculateClearanceScore(ilots);

    return spaceUtilization * 0.5 + accessibilityScore * 0.3 + clearanceScore * 0.2;
  }

  private calculateSpaceUtilization(ilots: Ilot[]): number {
    const totalIlotArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    return Math.min(100, (totalIlotArea / this.floorPlan.usableArea) * 100);
  }

  private calculateAccessibilityScore(ilots: Ilot[]): number {
    // Check if all ilots have adequate access paths
    let accessibleIlots = 0;

    ilots.forEach(ilot => {
      if (this.hasAccessPath(ilot, ilots)) {
        accessibleIlots++;
      }
    });

    return ilots.length > 0 ? (accessibleIlots / ilots.length) * 100 : 0;
  }

  private hasAccessPath(ilot: Ilot, allIlots: Ilot[]): boolean {
    // Simplified check - ensure minimum distance to walls and other ilots
    const minAccessWidth = 1200; // 1.2m minimum access width

    // Check distance to walls
    for (const wall of this.floorPlan.walls) {
      const distance = this.distancePointToLine(ilot.position, wall.start, wall.end);
      if (distance < minAccessWidth) {
        return false;
      }
    }

    return true;
  }

  private distancePointToLine(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateClearanceScore(ilots: Ilot[]): number {
    let totalClearance = 0;
    let pairCount = 0;

    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const distance = Math.sqrt(
          Math.pow(ilots[i].position.x - ilots[j].position.x, 2) +
          Math.pow(ilots[i].position.y - ilots[j].position.y, 2)
        );

        const requiredClearance = Math.max(ilots[i].clearance, ilots[j].clearance);
        const clearanceRatio = Math.min(1, distance / requiredClearance);
        
        totalClearance += clearanceRatio;
        pairCount++;
      }
    }

    return pairCount > 0 ? (totalClearance / pairCount) * 100 : 100;
  }

  private refineConfiguration(configuration: Ilot[]): Ilot[] {
    // Apply local optimization to improve the configuration
    const refined = [...configuration];

    for (let i = 0; i < refined.length; i++) {
      const original = { ...refined[i] };
      let bestScore = this.evaluateConfiguration(refined);
      let bestPosition = { ...original.position };

      // Try small adjustments
      for (let dx = -500; dx <= 500; dx += 100) {
        for (let dy = -500; dy <= 500; dy += 100) {
          refined[i].position = {
            x: original.position.x + dx,
            y: original.position.y + dy
          };

          const score = this.evaluateConfiguration(refined);
          if (score > bestScore) {
            bestScore = score;
            bestPosition = { ...refined[i].position };
          }
        }
      }

      refined[i].position = bestPosition;
    }

    return refined;
  }

  private calculateBounds(points: Point[]): Point[] {
    if (points.length === 0) return [];

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }

  private calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }
}