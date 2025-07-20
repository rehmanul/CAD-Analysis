
import { Point, Ilot, FloorPlan } from '../types/cad';
import { v4 as uuidv4 } from 'uuid';

interface IlotSize {
  type: 'small' | 'medium' | 'large';
  width: number;
  height: number;
  area: number;
  minClearance: number;
  preferredOrientation?: 'horizontal' | 'vertical' | 'any';
}

interface GeneticConfiguration {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
}

export class IlotOptimizer {
  private floorPlan: FloorPlan;
  private ilotSizes: IlotSize[] = [
    { 
      type: 'small', 
      width: 2000, 
      height: 2500, 
      area: 5000000, 
      minClearance: 800,
      preferredOrientation: 'any'
    },
    { 
      type: 'medium', 
      width: 2500, 
      height: 3000, 
      area: 7500000, 
      minClearance: 900,
      preferredOrientation: 'horizontal'
    },
    { 
      type: 'large', 
      width: 3000, 
      height: 4000, 
      area: 12000000, 
      minClearance: 1000,
      preferredOrientation: 'horizontal'
    }
  ];

  private geneticConfig: GeneticConfiguration = {
    populationSize: 50,
    maxGenerations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    elitismRate: 0.2
  };

  constructor(floorPlan: FloorPlan) {
    this.floorPlan = floorPlan;
  }

  optimizePlacement(_maxIterations: number = 1000): Ilot[] {
    console.log('Starting advanced îlot optimization...');
    
    // Calculate usable areas with enhanced geometry analysis
    const usableAreas = this.calculateAdvancedUsableAreas();
    console.log(`Found ${usableAreas.length} usable areas`);
    
    // Use genetic algorithm for optimization
    const bestConfiguration = this.geneticAlgorithmOptimization(usableAreas);
    
    // Apply post-processing optimization
    const optimized = this.postProcessConfiguration(bestConfiguration);
    
    console.log(`Optimized placement: ${optimized.length} îlots placed`);
    return optimized;
  }

  private calculateAdvancedUsableAreas(): Point[][] {
    const bounds = this.floorPlan.bounds;
    const minX = Math.min(...bounds.map(p => p.x));
    const maxX = Math.max(...bounds.map(p => p.x));
    const minY = Math.min(...bounds.map(p => p.y));
    const maxY = Math.max(...bounds.map(p => p.y));

    // Create high-resolution grid for detailed analysis
    const gridSize = 50; // 50mm resolution
    const width = Math.ceil((maxX - minX) / gridSize);
    const height = Math.ceil((maxY - minY) / gridSize);
    
    console.log(`Creating analysis grid: ${width}x${height}`);
    
    const grid = Array(height).fill(null).map(() => Array(width).fill(true));

    // Mark walls with thickness consideration
    this.floorPlan.walls.forEach(wall => {
      this.markAdvancedLineInGrid(grid, wall.start, wall.end, wall.thickness, gridSize, minX, minY);
    });

    // Mark doors and windows
    this.floorPlan.doors.forEach(door => {
      this.markDoorInGrid(grid, door, gridSize, minX, minY);
    });

    this.floorPlan.windows.forEach(window => {
      this.markWindowInGrid(grid, window, gridSize, minX, minY);
    });

    // Mark restricted areas with buffer zones
    this.floorPlan.restrictedAreas.forEach(area => {
      this.markRestrictedAreaInGrid(grid, area.bounds, gridSize, minX, minY, 1000); // 1m buffer
    });

    // Apply accessibility clearances
    this.applyAccessibilityClearances(grid, gridSize);

    // Convert grid to usable polygons
    const areas = this.gridToAdvancedPolygons(grid, gridSize, minX, minY);
    
    return areas.filter(area => this.calculatePolygonArea(area) > 4000000); // Minimum 4m²
  }

  private markAdvancedLineInGrid(
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

    // Enhanced Bresenham's algorithm with anti-aliasing
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      // Mark cells with graduated thickness
      for (let i = -thicknessCells; i <= thicknessCells; i++) {
        for (let j = -thicknessCells; j <= thicknessCells; j++) {
          const nx = x + i;
          const ny = y + j;
          const distance = Math.sqrt(i * i + j * j);
          
          if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
            if (distance <= thicknessCells) {
              grid[ny][nx] = false;
            }
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

  private markDoorInGrid(
    grid: boolean[][],
    door: import('../types/cad').Door,
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    const centerX = Math.floor((door.position.x - offsetX) / gridSize);
    const centerY = Math.floor((door.position.y - offsetY) / gridSize);
    const widthCells = Math.ceil(door.width / gridSize);
    const heightCells = Math.ceil(200 / gridSize); // Door thickness

    // Mark door opening and swing area
    for (let i = -widthCells/2; i <= widthCells/2; i++) {
      for (let j = -heightCells/2; j <= heightCells/2; j++) {
        const nx = centerX + i;
        const ny = centerY + j;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
          grid[ny][nx] = false;
        }
      }
    }

    // Mark door swing area
    if (door.swing === 'in') {
      const swingRadius = Math.ceil(door.width / gridSize);
      for (let angle = 0; angle <= 90; angle += 5) {
        const rad = (angle * Math.PI) / 180;
        const sx = Math.floor(centerX + swingRadius * Math.cos(rad));
        const sy = Math.floor(centerY + swingRadius * Math.sin(rad));
        if (sy >= 0 && sy < grid.length && sx >= 0 && sx < grid[0].length) {
          grid[sy][sx] = false;
        }
      }
    }
  }

  private markWindowInGrid(
    grid: boolean[][],
    window: import('../types/cad').Window,
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    const centerX = Math.floor((window.position.x - offsetX) / gridSize);
    const centerY = Math.floor((window.position.y - offsetY) / gridSize);
    const widthCells = Math.ceil(window.width / gridSize);
    const clearanceCells = Math.ceil(600 / gridSize); // 60cm clearance from windows

    // Mark clearance area in front of window
    for (let i = -widthCells/2; i <= widthCells/2; i++) {
      for (let j = 0; j <= clearanceCells; j++) {
        const nx = centerX + i;
        const ny = centerY + j;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
          grid[ny][nx] = false;
        }
      }
    }
  }

  private markRestrictedAreaInGrid(
    grid: boolean[][],
    polygon: Point[],
    gridSize: number,
    offsetX: number,
    offsetY: number,
    buffer: number
  ): void {
    // Expand polygon by buffer amount
    const expandedPolygon = this.expandPolygon(polygon, buffer);
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const worldX = x * gridSize + offsetX;
        const worldY = y * gridSize + offsetY;
        if (this.pointInPolygon({ x: worldX, y: worldY }, expandedPolygon)) {
          grid[y][x] = false;
        }
      }
    }
  }

  private expandPolygon(polygon: Point[], buffer: number): Point[] {
    // Simplified polygon expansion - create bounding box with buffer
    const minX = Math.min(...polygon.map(p => p.x)) - buffer;
    const maxX = Math.max(...polygon.map(p => p.x)) + buffer;
    const minY = Math.min(...polygon.map(p => p.y)) - buffer;
    const maxY = Math.max(...polygon.map(p => p.y)) + buffer;

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }

  private applyAccessibilityClearances(grid: boolean[][], gridSize: number): void {
    const clearanceCells = Math.ceil(1200 / gridSize); // 1.2m accessibility clearance
    const originalGrid = grid.map(row => [...row]);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (!originalGrid[y][x]) { // If cell is blocked
          // Apply clearance around blocked cells
          for (let dy = -clearanceCells; dy <= clearanceCells; dy++) {
            for (let dx = -clearanceCells; dx <= clearanceCells; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance <= clearanceCells && 
                  ny >= 0 && ny < grid.length && 
                  nx >= 0 && nx < grid[0].length) {
                grid[ny][nx] = false;
              }
            }
          }
        }
      }
    }
  }

  private gridToAdvancedPolygons(grid: boolean[][], gridSize: number, offsetX: number, offsetY: number): Point[][] {
    const areas: Point[][] = [];
    const visited = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(false));

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x] && !visited[y][x]) {
          const area = this.advancedFloodFill(grid, visited, x, y, gridSize, offsetX, offsetY);
          if (area.length > 0) {
            areas.push(area);
          }
        }
      }
    }

    return areas;
  }

  private advancedFloodFill(
    grid: boolean[][],
    visited: boolean[][],
    startX: number,
    startY: number,
    gridSize: number,
    offsetX: number,
    offsetY: number
  ): Point[] {
    const stack = [{ x: startX, y: startY }];
    const cells = [];

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
      cells.push({ x, y });

      // 8-connected flood fill
      stack.push(
        { x: x + 1, y }, { x: x - 1, y },
        { x, y: y + 1 }, { x, y: y - 1 },
        { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
        { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
      );
    }

    if (cells.length === 0) return [];

    // Convert cells to polygon boundary
    const minX = Math.min(...cells.map(c => c.x)) * gridSize + offsetX;
    const maxX = (Math.max(...cells.map(c => c.x)) + 1) * gridSize + offsetX;
    const minY = Math.min(...cells.map(c => c.y)) * gridSize + offsetY;
    const maxY = (Math.max(...cells.map(c => c.y)) + 1) * gridSize + offsetY;

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }

  private geneticAlgorithmOptimization(usableAreas: Point[][]): Ilot[] {
    console.log('Starting genetic algorithm optimization...');
    
    // Initialize population
    let population = this.initializePopulation(usableAreas);
    let bestFitness = 0;
    let bestIndividual: Ilot[] = [];

    for (let generation = 0; generation < this.geneticConfig.maxGenerations; generation++) {
      // Evaluate fitness for all individuals
      const fitnessScores = population.map(individual => ({
        individual,
        fitness: this.evaluateAdvancedFitness(individual)
      }));

      // Sort by fitness
      fitnessScores.sort((a, b) => b.fitness - a.fitness);
      
      // Track best individual
      if (fitnessScores[0].fitness > bestFitness) {
        bestFitness = fitnessScores[0].fitness;
        bestIndividual = [...fitnessScores[0].individual];
        console.log(`Generation ${generation}: Best fitness = ${bestFitness.toFixed(2)}`);
      }

      // Create next generation
      const nextPopulation: Ilot[][] = [];
      
      // Elitism - keep best individuals
      const eliteCount = Math.floor(this.geneticConfig.populationSize * this.geneticConfig.elitismRate);
      for (let i = 0; i < eliteCount; i++) {
        nextPopulation.push([...fitnessScores[i].individual]);
      }

      // Crossover and mutation
      while (nextPopulation.length < this.geneticConfig.populationSize) {
        const parent1 = this.tournamentSelection(fitnessScores);
        const parent2 = this.tournamentSelection(fitnessScores);
        
        let offspring: Ilot[];
        if (Math.random() < this.geneticConfig.crossoverRate) {
          offspring = this.crossover(parent1, parent2);
        } else {
          offspring = [...parent1];
        }
        
        if (Math.random() < this.geneticConfig.mutationRate) {
          offspring = this.mutate(offspring, usableAreas);
        }
        
        nextPopulation.push(offspring);
      }

      population = nextPopulation;
    }

    console.log(`Genetic algorithm completed. Best fitness: ${bestFitness.toFixed(2)}`);
    return bestIndividual;
  }

  private initializePopulation(usableAreas: Point[][]): Ilot[][] {
    const population: Ilot[][] = [];
    
    for (let i = 0; i < this.geneticConfig.populationSize; i++) {
      const individual = this.generateRandomConfiguration(usableAreas);
      population.push(individual);
    }
    
    return population;
  }

  private generateRandomConfiguration(usableAreas: Point[][]): Ilot[] {
    const ilots: Ilot[] = [];
    
    usableAreas.forEach(area => {
      const areaSize = this.calculatePolygonArea(area);
      const bounds = this.calculateBounds(area);
      const areaWidth = bounds.maxX - bounds.minX;
      const areaHeight = bounds.maxY - bounds.minY;
      
      // Determine optimal layout pattern
      if (areaSize > 20000000) { // Large areas (>20m²)
        const targetIlots = Math.floor(areaSize / 8000000); // One îlot per 8m²
        
        if (areaWidth > areaHeight * 1.5) {
          this.createOptimizedHorizontalRows(area, bounds, ilots, targetIlots);
        } else if (areaHeight > areaWidth * 1.5) {
          this.createOptimizedVerticalColumns(area, bounds, ilots, targetIlots);
        } else {
          this.createOptimizedGridPattern(area, bounds, ilots, targetIlots);
        }
      }
    });

    return ilots;
  }

  private createOptimizedHorizontalRows(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200;
    const ilotSpacing = 800;
    
    const availableHeight = bounds.maxY - bounds.minY;
    const ilotHeight = 2500; // Standard îlot depth
    const rowSpacing = ilotHeight + corridorWidth + 400; // Row + corridor + clearance
    const maxRows = Math.floor(availableHeight / rowSpacing);
    
    for (let row = 0; row < maxRows && ilots.length < targetIlots; row++) {
      const y = bounds.minY + (row * rowSpacing) + rowSpacing / 2;
      
      const ilotsPerRow = Math.min(6, Math.ceil(targetIlots / maxRows));
      const availableWidth = bounds.maxX - bounds.minX;
      const totalSpacing = (ilotsPerRow - 1) * ilotSpacing;
      const ilotWidth = Math.min(3000, (availableWidth - totalSpacing) / ilotsPerRow);
      
      if (ilotWidth < 1500) continue; // Skip if îlots too narrow
      
      for (let col = 0; col < ilotsPerRow && ilots.length < targetIlots; col++) {
        const x = bounds.minX + (col * (ilotWidth + ilotSpacing)) + ilotWidth / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const ilotSize = this.selectOptimalIlotSize(ilotWidth, ilotHeight);
          ilots.push({
            id: uuidv4(),
            position,
            width: ilotWidth,
            height: ilotHeight,
            area: ilotWidth * ilotHeight,
            type: ilotSize.type,
            rotation: 0,
            clearance: ilotSize.minClearance,
            accessibility: true
          });
        }
      }
    }
  }

  private createOptimizedVerticalColumns(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200;
    const ilotSpacing = 800;
    
    const availableWidth = bounds.maxX - bounds.minX;
    const ilotWidth = 2500;
    const colSpacing = ilotWidth + corridorWidth + 400;
    const maxCols = Math.floor(availableWidth / colSpacing);
    
    for (let col = 0; col < maxCols && ilots.length < targetIlots; col++) {
      const x = bounds.minX + (col * colSpacing) + colSpacing / 2;
      
      const ilotsPerCol = Math.min(6, Math.ceil(targetIlots / maxCols));
      const availableHeight = bounds.maxY - bounds.minY;
      const totalSpacing = (ilotsPerCol - 1) * ilotSpacing;
      const ilotHeight = Math.min(3500, (availableHeight - totalSpacing) / ilotsPerCol);
      
      if (ilotHeight < 1500) continue;
      
      for (let row = 0; row < ilotsPerCol && ilots.length < targetIlots; row++) {
        const y = bounds.minY + (row * (ilotHeight + ilotSpacing)) + ilotHeight / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const ilotSize = this.selectOptimalIlotSize(ilotWidth, ilotHeight);
          ilots.push({
            id: uuidv4(),
            position,
            width: ilotWidth,
            height: ilotHeight,
            area: ilotWidth * ilotHeight,
            type: ilotSize.type,
            rotation: 0,
            clearance: ilotSize.minClearance,
            accessibility: true
          });
        }
      }
    }
  }

  private createOptimizedGridPattern(area: Point[], bounds: any, ilots: Ilot[], targetIlots: number): void {
    const corridorWidth = 1200;
    const minIlotSize = 2000;
    
    const gridCells = Math.ceil(Math.sqrt(targetIlots));
    const cellWidth = (bounds.maxX - bounds.minX) / gridCells;
    const cellHeight = (bounds.maxY - bounds.minY) / gridCells;
    
    for (let row = 0; row < gridCells && ilots.length < targetIlots; row++) {
      for (let col = 0; col < gridCells && ilots.length < targetIlots; col++) {
        const x = bounds.minX + (col * cellWidth) + cellWidth / 2;
        const y = bounds.minY + (row * cellHeight) + cellHeight / 2;
        const position = { x, y };
        
        if (this.pointInPolygon(position, area)) {
          const maxWidth = Math.min(3000, cellWidth - corridorWidth);
          const maxHeight = Math.min(3000, cellHeight - corridorWidth);
          
          if (maxWidth >= minIlotSize && maxHeight >= minIlotSize) {
            const ilotSize = this.selectOptimalIlotSize(maxWidth, maxHeight);
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

  private selectOptimalIlotSize(width: number, height: number): IlotSize {
    const area = width * height;
    
    // Select size category based on area
    if (area <= 6000000) return this.ilotSizes[0]; // small
    if (area <= 10000000) return this.ilotSizes[1]; // medium
    return this.ilotSizes[2]; // large
  }

  private evaluateAdvancedFitness(ilots: Ilot[]): number {
    const spaceUtilization = this.calculateSpaceUtilization(ilots);
    const accessibilityScore = this.calculateAdvancedAccessibilityScore(ilots);
    const clearanceScore = this.calculateAdvancedClearanceScore(ilots);
    const layoutQuality = this.calculateLayoutQuality(ilots);
    const proximityScore = this.calculateProximityScore(ilots);

    return (
      spaceUtilization * 0.25 +
      accessibilityScore * 0.25 +
      clearanceScore * 0.2 +
      layoutQuality * 0.15 +
      proximityScore * 0.15
    );
  }

  private calculateLayoutQuality(ilots: Ilot[]): number {
    if (ilots.length === 0) return 0;
    
    // Evaluate how well îlots form regular patterns
    let alignmentScore = 0;
    let regularityScore = 0;
    
    // Check horizontal alignment
    const tolerance = 500; // 50cm tolerance
    const horizontalGroups = this.groupByCoordinate(ilots, 'y', tolerance);
    alignmentScore += horizontalGroups.filter(group => group.length > 1).length * 10;
    
    // Check vertical alignment
    const verticalGroups = this.groupByCoordinate(ilots, 'x', tolerance);
    alignmentScore += verticalGroups.filter(group => group.length > 1).length * 10;
    
    // Check size consistency
    const sizeVariation = this.calculateSizeVariation(ilots);
    regularityScore = Math.max(0, 100 - sizeVariation);
    
    return Math.min(100, alignmentScore + regularityScore / 2);
  }

  private groupByCoordinate(ilots: Ilot[], coordinate: 'x' | 'y', tolerance: number): Ilot[][] {
    const groups: Ilot[][] = [];
    const used = new Set<string>();
    
    ilots.forEach(ilot => {
      if (used.has(ilot.id)) return;
      
      const group = [ilot];
      used.add(ilot.id);
      
      const baseValue = ilot.position[coordinate];
      
      ilots.forEach(other => {
        if (!used.has(other.id) && 
            Math.abs(other.position[coordinate] - baseValue) <= tolerance) {
          group.push(other);
          used.add(other.id);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }

  private calculateSizeVariation(ilots: Ilot[]): number {
    if (ilots.length <= 1) return 0;
    
    const areas = ilots.map(ilot => ilot.area);
    const mean = areas.reduce((sum, area) => sum + area, 0) / areas.length;
    const variance = areas.reduce((sum, area) => sum + Math.pow(area - mean, 2), 0) / areas.length;
    const standardDeviation = Math.sqrt(variance);
    
    return (standardDeviation / mean) * 100; // Coefficient of variation as percentage
  }

  private calculateProximityScore(ilots: Ilot[]): number {
    if (ilots.length <= 1) return 100;
    
    let totalScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const distance = this.calculateDistance(ilots[i].position, ilots[j].position);
        const optimalDistance = 2000; // 2m optimal distance
        const score = Math.max(0, 100 - Math.abs(distance - optimalDistance) / 50);
        totalScore += score;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalScore / pairCount : 100;
  }

  private calculateAdvancedAccessibilityScore(ilots: Ilot[]): number {
    let accessibleIlots = 0;
    const minAccessWidth = 1200; // 1.2m ADA compliance

    ilots.forEach(ilot => {
      let hasAccess = true;
      
      // Check access from all sides
      const accessPoints = [
        { x: ilot.position.x + ilot.width/2 + minAccessWidth, y: ilot.position.y },
        { x: ilot.position.x - ilot.width/2 - minAccessWidth, y: ilot.position.y },
        { x: ilot.position.x, y: ilot.position.y + ilot.height/2 + minAccessWidth },
        { x: ilot.position.x, y: ilot.position.y - ilot.height/2 - minAccessWidth }
      ];
      
      const accessibleSides = accessPoints.filter(point => 
        this.isPointAccessible(point, ilot, ilots)
      );
      
      if (accessibleSides.length < 2) {
        hasAccess = false;
      }
      
      if (hasAccess) {
        accessibleIlots++;
      }
    });

    return ilots.length > 0 ? (accessibleIlots / ilots.length) * 100 : 100;
  }

  private isPointAccessible(point: Point, currentIlot: Ilot, allIlots: Ilot[]): boolean {
    const minClearance = 1200;
    
    // Check distance to walls
    for (const wall of this.floorPlan.walls) {
      const distance = this.distancePointToLine(point, wall.start, wall.end);
      if (distance < minClearance) {
        return false;
      }
    }
    
    // Check distance to other îlots
    for (const ilot of allIlots) {
      if (ilot.id === currentIlot.id) continue;
      
      const distance = this.calculateDistance(point, ilot.position);
      const requiredDistance = minClearance + Math.max(ilot.width, ilot.height) / 2;
      
      if (distance < requiredDistance) {
        return false;
      }
    }
    
    return true;
  }

  private calculateAdvancedClearanceScore(ilots: Ilot[]): number {
    if (ilots.length <= 1) return 100;
    
    let totalScore = 0;
    let pairCount = 0;

    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const distance = this.calculateDistance(ilots[i].position, ilots[j].position);
        const requiredClearance = Math.max(ilots[i].clearance, ilots[j].clearance);
        const minDistance = requiredClearance + (ilots[i].width + ilots[j].width) / 4;
        
        const clearanceRatio = Math.min(2, distance / minDistance);
        const score = Math.min(100, clearanceRatio * 50);
        
        totalScore += score;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalScore / pairCount : 100;
  }

  private tournamentSelection(fitnessScores: { individual: Ilot[], fitness: number }[]): Ilot[] {
    const tournamentSize = 3;
    let best = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    
    return best.individual;
  }

  private crossover(parent1: Ilot[], parent2: Ilot[]): Ilot[] {
    const offspring: Ilot[] = [];
    const maxLength = Math.max(parent1.length, parent2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < parent1.length && i < parent2.length) {
        // Choose randomly between parents
        const chosen = Math.random() < 0.5 ? parent1[i] : parent2[i];
        offspring.push({ ...chosen });
      } else if (i < parent1.length) {
        offspring.push({ ...parent1[i] });
      } else {
        offspring.push({ ...parent2[i] });
      }
    }
    
    return offspring;
  }

  private mutate(individual: Ilot[], usableAreas: Point[][]): Ilot[] {
    const mutated = [...individual];
    const mutationProbability = 0.1;
    
    mutated.forEach(ilot => {
      if (Math.random() < mutationProbability) {
        // Small position adjustment
        const adjustmentRange = 500; // 50cm
        ilot.position.x += (Math.random() - 0.5) * adjustmentRange;
        ilot.position.y += (Math.random() - 0.5) * adjustmentRange;
        
        // Ensure îlot stays within usable areas
        const containingArea = usableAreas.find(area => 
          this.pointInPolygon(ilot.position, area)
        );
        
        if (!containingArea && usableAreas.length > 0) {
          // Move to a valid area
          const randomArea = usableAreas[Math.floor(Math.random() * usableAreas.length)];
          const bounds = this.calculateBounds(randomArea);
          ilot.position.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
          ilot.position.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
        }
      }
    });
    
    return mutated;
  }

  private postProcessConfiguration(configuration: Ilot[]): Ilot[] {
    console.log('Applying post-processing optimization...');
    
    // Remove overlapping îlots
    let optimized = this.removeOverlappingIlots(configuration);
    
    // Snap to grid for better alignment
    optimized = this.snapToGrid(optimized, 100); // 10cm grid
    
    // Fine-tune positions for optimal spacing
    optimized = this.optimizeSpacing(optimized);
    
    return optimized;
  }

  private removeOverlappingIlots(ilots: Ilot[]): Ilot[] {
    const nonOverlapping: Ilot[] = [];
    
    ilots.forEach(ilot => {
      const overlaps = nonOverlapping.some(existing => 
        this.ilotsOverlap(ilot, existing)
      );
      
      if (!overlaps) {
        nonOverlapping.push(ilot);
      }
    });
    
    return nonOverlapping;
  }

  private ilotsOverlap(ilot1: Ilot, ilot2: Ilot): boolean {
    const bounds1 = this.getIlotBounds(ilot1);
    const bounds2 = this.getIlotBounds(ilot2);
    
    return !(bounds1.right < bounds2.left || 
             bounds2.right < bounds1.left || 
             bounds1.bottom < bounds2.top || 
             bounds2.bottom < bounds1.top);
  }

  private getIlotBounds(ilot: Ilot) {
    const halfWidth = ilot.width / 2;
    const halfHeight = ilot.height / 2;
    
    return {
      left: ilot.position.x - halfWidth,
      right: ilot.position.x + halfWidth,
      top: ilot.position.y - halfHeight,
      bottom: ilot.position.y + halfHeight
    };
  }

  private snapToGrid(ilots: Ilot[], gridSize: number): Ilot[] {
    return ilots.map(ilot => ({
      ...ilot,
      position: {
        x: Math.round(ilot.position.x / gridSize) * gridSize,
        y: Math.round(ilot.position.y / gridSize) * gridSize
      }
    }));
  }

  private optimizeSpacing(ilots: Ilot[]): Ilot[] {
    const optimized = [...ilots];
    const iterations = 10;
    
    for (let iter = 0; iter < iterations; iter++) {
      optimized.forEach((ilot, index) => {
        const forces = this.calculateSpacingForces(ilot, optimized, index);
        
        // Apply small adjustments based on forces
        const dampening = 0.1;
        ilot.position.x += forces.x * dampening;
        ilot.position.y += forces.y * dampening;
      });
    }
    
    return optimized;
  }

  private calculateSpacingForces(ilot: Ilot, allIlots: Ilot[], currentIndex: number): Point {
    let forceX = 0;
    let forceY = 0;
    
    allIlots.forEach((other, index) => {
      if (index === currentIndex) return;
      
      const dx = ilot.position.x - other.position.x;
      const dy = ilot.position.y - other.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const optimalDistance = 2000; // 2m optimal spacing
        const force = (distance - optimalDistance) / distance;
        
        forceX += dx * force * 0.1;
        forceY += dy * force * 0.1;
      }
    });
    
    return { x: forceX, y: forceY };
  }

  // Utility methods
  private calculateSpaceUtilization(ilots: Ilot[]): number {
    const totalIlotArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    return Math.min(100, (totalIlotArea / this.floorPlan.usableArea) * 100);
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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

  private calculateBounds(points: Point[]): any {
    if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    return {
      minX: Math.min(...points.map(p => p.x)),
      maxX: Math.max(...points.map(p => p.x)),
      minY: Math.min(...points.map(p => p.y)),
      maxY: Math.max(...points.map(p => p.y))
    };
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
