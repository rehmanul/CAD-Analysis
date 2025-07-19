import { Point, Ilot, FloorPlan, Corridor } from '../types/cad';
import { v4 as uuidv4 } from 'uuid';

export interface CorridorConfig {
  width: number; // Width in mm (default 1200mm = 1.2m)
  minClearance: number; // Minimum clearance from walls
  maxLength: number; // Maximum corridor length
  accessibility: boolean; // Must meet accessibility standards
}

export class CorridorGenerator {
  private floorPlan: FloorPlan;
  private ilots: Ilot[];
  private config: CorridorConfig;

  constructor(floorPlan: FloorPlan, ilots: Ilot[], config: Partial<CorridorConfig> = {}) {
    this.floorPlan = floorPlan;
    this.ilots = ilots;
    this.config = {
      width: 1200, // 1.2m default
      minClearance: 600, // 60cm from walls
      maxLength: 15000, // 15m max corridor
      accessibility: true,
      ...config
    };
  }

  generateCorridors(): Corridor[] {
    const corridors: Corridor[] = [];
    
    // Step 1: Identify facing ilot pairs that need corridors
    const facingPairs = this.findFacingIlotPairs();
    
    // Step 2: Generate corridors between facing pairs
    facingPairs.forEach(pair => {
      const corridor = this.createCorridorBetweenIlots(pair.ilot1, pair.ilot2);
      if (corridor) {
        corridors.push(corridor);
      }
    });

    // Step 3: Generate main circulation corridors
    const mainCorridors = this.generateMainCirculationCorridors();
    corridors.push(...mainCorridors);

    // Step 4: Connect isolated ilots
    const connectionCorridors = this.connectIsolatedIlots(corridors);
    corridors.push(...connectionCorridors);

    // Step 5: Optimize corridor network
    return this.optimizeCorridorNetwork(corridors);
  }

  private findFacingIlotPairs(): { ilot1: Ilot; ilot2: Ilot; direction: 'horizontal' | 'vertical' }[] {
    const pairs: { ilot1: Ilot; ilot2: Ilot; direction: 'horizontal' | 'vertical' }[] = [];
    
    for (let i = 0; i < this.ilots.length; i++) {
      for (let j = i + 1; j < this.ilots.length; j++) {
        const ilot1 = this.ilots[i];
        const ilot2 = this.ilots[j];
        
        const facing = this.areIlotsFacing(ilot1, ilot2);
        if (facing) {
          pairs.push({
            ilot1,
            ilot2,
            direction: facing.direction
          });
        }
      }
    }
    
    return pairs;
  }

  private areIlotsFacing(ilot1: Ilot, ilot2: Ilot): { direction: 'horizontal' | 'vertical' } | null {
    const alignmentTolerance = 800; // 80cm tolerance for alignment - more realistic
    const maxDistance = 6000; // Maximum 6m distance for facing relationship
    const minDistance = 1500; // Minimum 1.5m distance to avoid too close îlots
    
    // Calculate ilot bounds
    const bounds1 = this.getIlotBounds(ilot1);
    const bounds2 = this.getIlotBounds(ilot2);
    
    const centerDistance = this.calculateDistance(bounds1.center, bounds2.center);
    
    // Too close or too far
    if (centerDistance < minDistance || centerDistance > maxDistance) {
      return null;
    }
    
    // Check horizontal facing (îlots in same row, facing each other across corridor)
    const yAlignment = Math.abs(bounds1.center.y - bounds2.center.y);
    const xSeparation = Math.abs(bounds1.center.x - bounds2.center.x);
    
    if (
      yAlignment < alignmentTolerance && // Y aligned (same row)
      xSeparation >= this.config.width + 600 && // Adequate space for corridor + margins
      (bounds1.right < bounds2.left - this.config.width || bounds2.right < bounds1.left - this.config.width) // Not overlapping with corridor space
    ) {
      return { direction: 'horizontal' };
    }
    
    // Check vertical facing (îlots in same column, facing each other across corridor)
    const xAlignment = Math.abs(bounds1.center.x - bounds2.center.x);
    const ySeparation = Math.abs(bounds1.center.y - bounds2.center.y);
    
    if (
      xAlignment < alignmentTolerance && // X aligned (same column)
      ySeparation >= this.config.width + 600 && // Adequate space for corridor + margins
      (bounds1.bottom < bounds2.top - this.config.width || bounds2.bottom < bounds1.top - this.config.width) // Not overlapping with corridor space
    ) {
      return { direction: 'vertical' };
    }
    
    return null;
  }

  private getIlotBounds(ilot: Ilot) {
    const halfWidth = ilot.width / 2;
    const halfHeight = ilot.height / 2;
    
    return {
      left: ilot.position.x - halfWidth,
      right: ilot.position.x + halfWidth,
      top: ilot.position.y - halfHeight,
      bottom: ilot.position.y + halfHeight,
      center: ilot.position
    };
  }

  private createCorridorBetweenIlots(ilot1: Ilot, ilot2: Ilot): Corridor | null {
    const bounds1 = this.getIlotBounds(ilot1);
    const bounds2 = this.getIlotBounds(ilot2);
    
    // Determine corridor direction and calculate path that touches îlots
    let path: Point[] = [];
    let corridorLength = 0;
    
    // Check if they're horizontally aligned (same row)
    if (Math.abs(bounds1.center.y - bounds2.center.y) < 800) {
      // Horizontal corridor between facing îlots
      const y = (bounds1.center.y + bounds2.center.y) / 2;
      
      let startX: number, endX: number;
      
      if (bounds1.center.x < bounds2.center.x) {
        // ilot1 is to the left of ilot2
        startX = bounds1.right; // Touch the right edge of ilot1
        endX = bounds2.left;   // Touch the left edge of ilot2
      } else {
        // ilot1 is to the right of ilot2
        startX = bounds2.right; // Touch the right edge of ilot2
        endX = bounds1.left;   // Touch the left edge of ilot1
      }
      
      // Ensure minimum corridor width
      if (Math.abs(endX - startX) >= this.config.width) {
        path = [
          { x: startX, y },
          { x: endX, y }
        ];
        corridorLength = Math.abs(endX - startX);
      }
    } 
    // Check if they're vertically aligned (same column)
    else if (Math.abs(bounds1.center.x - bounds2.center.x) < 800) {
      // Vertical corridor between facing îlots
      const x = (bounds1.center.x + bounds2.center.x) / 2;
      
      let startY: number, endY: number;
      
      if (bounds1.center.y < bounds2.center.y) {
        // ilot1 is above ilot2
        startY = bounds1.bottom; // Touch the bottom edge of ilot1
        endY = bounds2.top;     // Touch the top edge of ilot2
      } else {
        // ilot1 is below ilot2
        startY = bounds2.bottom; // Touch the bottom edge of ilot2
        endY = bounds1.top;     // Touch the top edge of ilot1
      }
      
      // Ensure minimum corridor width
      if (Math.abs(endY - startY) >= this.config.width) {
        path = [
          { x, y: startY },
          { x, y: endY }
        ];
        corridorLength = Math.abs(endY - startY);
      }
    }
    
    if (path.length < 2 || !this.isCorridorValid(path)) {
      return null;
    }
    
    return {
      id: uuidv4(),
      path,
      width: this.config.width,
      type: 'secondary',
      length: corridorLength,
      accessibility: this.config.accessibility
    };
  }

  private generateMainCirculationCorridors(): Corridor[] {
    const mainCorridors: Corridor[] = [];
    
    // Create a main circulation spine
    const bounds = this.calculateFloorPlanBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Group ilots by regions to create main circulation paths
    const regions = this.groupIlotsByRegion();
    
    regions.forEach((region, index) => {
      if (region.length > 2) {
        const spine = this.createRegionSpine(region);
        if (spine) {
          mainCorridors.push(spine);
        }
      }
    });
    
    return mainCorridors;
  }

  private groupIlotsByRegion(): Ilot[][] {
    const regions: Ilot[][] = [];
    const visited = new Set<string>();
    
    this.ilots.forEach(ilot => {
      if (visited.has(ilot.id)) return;
      
      const region = this.findConnectedIlots(ilot, visited);
      if (region.length > 1) {
        regions.push(region);
      }
    });
    
    return regions;
  }

  private findConnectedIlots(startIlot: Ilot, visited: Set<string>): Ilot[] {
    const region: Ilot[] = [startIlot];
    visited.add(startIlot.id);
    const proximityThreshold = 6000; // 6m proximity threshold
    
    const queue = [startIlot];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      this.ilots.forEach(other => {
        if (!visited.has(other.id)) {
          const distance = this.calculateDistance(current.position, other.position);
          if (distance < proximityThreshold) {
            region.push(other);
            visited.add(other.id);
            queue.push(other);
          }
        }
      });
    }
    
    return region;
  }

  private createRegionSpine(region: Ilot[]): Corridor | null {
    if (region.length < 2) return null;
    
    // Calculate the centroid of the region
    const centroid = this.calculateCentroid(region.map(ilot => ilot.position));
    
    // Find the optimal spine path through the region
    const sortedByX = [...region].sort((a, b) => a.position.x - b.position.x);
    const sortedByY = [...region].sort((a, b) => a.position.y - b.position.y);
    
    // Determine primary direction (horizontal or vertical) based on spread
    const xSpread = sortedByX[sortedByX.length - 1].position.x - sortedByX[0].position.x;
    const ySpread = sortedByY[sortedByY.length - 1].position.y - sortedByY[0].position.y;
    
    let path: Point[] = [];
    
    if (xSpread > ySpread) {
      // Horizontal spine
      const y = centroid.y;
      const startX = sortedByX[0].position.x - 1000; // Extend 1m beyond
      const endX = sortedByX[sortedByX.length - 1].position.x + 1000;
      path = [{ x: startX, y }, { x: endX, y }];
    } else {
      // Vertical spine
      const x = centroid.x;
      const startY = sortedByY[0].position.y - 1000;
      const endY = sortedByY[sortedByY.length - 1].position.y + 1000;
      path = [{ x, y: startY }, { x, y: endY }];
    }
    
    if (!this.isCorridorValid(path)) {
      return null;
    }
    
    return {
      id: uuidv4(),
      path,
      width: this.config.width * 1.5, // Main corridors are wider
      type: 'main',
      length: this.calculatePathLength(path),
      accessibility: true
    };
  }

  private connectIsolatedIlots(existingCorridors: Corridor[]): Corridor[] {
    const connectionCorridors: Corridor[] = [];
    const connectedIlots = new Set<string>();
    
    // Mark ilots that are already connected by existing corridors
    existingCorridors.forEach(corridor => {
      const touchingIlots = this.findIlotsTouchingCorridor(corridor);
      touchingIlots.forEach(ilot => connectedIlots.add(ilot.id));
    });
    
    // Find isolated ilots
    const isolatedIlots = this.ilots.filter(ilot => !connectedIlots.has(ilot.id));
    
    // Connect each isolated ilot to the nearest corridor or connected ilot
    isolatedIlots.forEach(isolatedIlot => {
      const connection = this.findBestConnection(isolatedIlot, existingCorridors, connectedIlots);
      if (connection) {
        connectionCorridors.push(connection);
        connectedIlots.add(isolatedIlot.id);
      }
    });
    
    return connectionCorridors;
  }

  private findIlotsTouchingCorridor(corridor: Corridor): Ilot[] {
    const touchingIlots: Ilot[] = [];
    const touchThreshold = this.config.width / 2 + 100; // Corridor half-width + 10cm tolerance
    
    this.ilots.forEach(ilot => {
      const minDistance = this.minimumDistanceToPath(ilot.position, corridor.path);
      if (minDistance <= touchThreshold) {
        touchingIlots.push(ilot);
      }
    });
    
    return touchingIlots;
  }

  private findBestConnection(isolatedIlot: Ilot, existingCorridors: Corridor[], connectedIlots: Set<string>): Corridor | null {
    let bestConnection: Corridor | null = null;
    let bestScore = Infinity;
    
    // Try connecting to existing corridors
    existingCorridors.forEach(corridor => {
      const connection = this.createConnectionToCorridor(isolatedIlot, corridor);
      if (connection) {
        const score = connection.length;
        if (score < bestScore) {
          bestScore = score;
          bestConnection = connection;
        }
      }
    });
    
    // Try connecting to connected ilots
    this.ilots.filter(ilot => connectedIlots.has(ilot.id)).forEach(connectedIlot => {
      const connection = this.createDirectConnection(isolatedIlot, connectedIlot);
      if (connection) {
        const score = connection.length;
        if (score < bestScore) {
          bestScore = score;
          bestConnection = connection;
        }
      }
    });
    
    return bestConnection;
  }

  private createConnectionToCorridor(ilot: Ilot, corridor: Corridor): Corridor | null {
    const closestPoint = this.findClosestPointOnPath(ilot.position, corridor.path);
    const distance = this.calculateDistance(ilot.position, closestPoint);
    
    if (distance > this.config.maxLength) {
      return null;
    }
    
    const path = [ilot.position, closestPoint];
    
    if (!this.isCorridorValid(path)) {
      return null;
    }
    
    return {
      id: uuidv4(),
      path,
      width: this.config.width,
      type: 'secondary',
      length: distance,
      accessibility: this.config.accessibility
    };
  }

  private createDirectConnection(ilot1: Ilot, ilot2: Ilot): Corridor | null {
    const distance = this.calculateDistance(ilot1.position, ilot2.position);
    
    if (distance > this.config.maxLength) {
      return null;
    }
    
    const path = [ilot1.position, ilot2.position];
    
    if (!this.isCorridorValid(path)) {
      return null;
    }
    
    return {
      id: uuidv4(),
      path,
      width: this.config.width,
      type: 'secondary',
      length: distance,
      accessibility: this.config.accessibility
    };
  }

  private isCorridorValid(path: Point[]): boolean {
    // Check if corridor intersects with walls
    for (let i = 0; i < path.length - 1; i++) {
      const segment = { start: path[i], end: path[i + 1] };
      
      if (this.intersectsWithWalls(segment)) {
        return false;
      }
      
      if (this.intersectsWithRestrictedAreas(segment)) {
        return false;
      }
      
      if (this.intersectsWithIlots(segment)) {
        return false;
      }
    }
    
    return true;
  }

  private intersectsWithWalls(segment: { start: Point; end: Point }): boolean {
    const buffer = this.config.minClearance;
    
    return this.floorPlan.walls.some(wall => {
      const distance = this.distanceSegmentToSegment(segment, wall);
      return distance < buffer;
    });
  }

  private intersectsWithRestrictedAreas(segment: { start: Point; end: Point }): boolean {
    return this.floorPlan.restrictedAreas.some(area => {
      return this.segmentIntersectsPolygon(segment, area.bounds);
    });
  }

  private intersectsWithIlots(segment: { start: Point; end: Point }): boolean {
    const buffer = 200; // 20cm buffer around ilots
    
    return this.ilots.some(ilot => {
      const ilotBounds = this.getIlotBounds(ilot);
      const expandedBounds = [
        { x: ilotBounds.left - buffer, y: ilotBounds.top - buffer },
        { x: ilotBounds.right + buffer, y: ilotBounds.top - buffer },
        { x: ilotBounds.right + buffer, y: ilotBounds.bottom + buffer },
        { x: ilotBounds.left - buffer, y: ilotBounds.bottom + buffer }
      ];
      
      return this.segmentIntersectsPolygon(segment, expandedBounds);
    });
  }

  private optimizeCorridorNetwork(corridors: Corridor[]): Corridor[] {
    // Remove redundant corridors
    const optimized = this.removeRedundantCorridors(corridors);
    
    // Merge overlapping corridors
    return this.mergeOverlappingCorridors(optimized);
  }

  private removeRedundantCorridors(corridors: Corridor[]): Corridor[] {
    const filtered: Corridor[] = [];
    
    corridors.forEach(corridor => {
      const isRedundant = filtered.some(existing => 
        this.corridorsOverlap(corridor, existing) && 
        existing.type === 'main' && 
        corridor.type === 'secondary'
      );
      
      if (!isRedundant) {
        filtered.push(corridor);
      }
    });
    
    return filtered;
  }

  private mergeOverlappingCorridors(corridors: Corridor[]): Corridor[] {
    const merged: Corridor[] = [];
    const processed = new Set<string>();
    
    corridors.forEach(corridor => {
      if (processed.has(corridor.id)) return;
      
      const overlapping = corridors.filter(other => 
        other.id !== corridor.id && 
        !processed.has(other.id) && 
        this.corridorsOverlap(corridor, other)
      );
      
      if (overlapping.length > 0) {
        const mergedCorridor = this.mergeCorridor(corridor, overlapping);
        merged.push(mergedCorridor);
        processed.add(corridor.id);
        overlapping.forEach(c => processed.add(c.id));
      } else {
        merged.push(corridor);
        processed.add(corridor.id);
      }
    });
    
    return merged;
  }

  // Utility methods
  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private calculateCentroid(points: Point[]): Point {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  private calculatePathLength(path: Point[]): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      length += this.calculateDistance(path[i], path[i + 1]);
    }
    return length;
  }

  private minimumDistanceToPath(point: Point, path: Point[]): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < path.length - 1; i++) {
      const distance = this.distancePointToSegment(point, path[i], path[i + 1]);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  private distancePointToSegment(point: Point, segStart: Point, segEnd: Point): number {
    const A = point.x - segStart.x;
    const B = point.y - segStart.y;
    const C = segEnd.x - segStart.x;
    const D = segEnd.y - segStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = segStart.x;
      yy = segStart.y;
    } else if (param > 1) {
      xx = segEnd.x;
      yy = segEnd.y;
    } else {
      xx = segStart.x + param * C;
      yy = segStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private findClosestPointOnPath(point: Point, path: Point[]): Point {
    let closestPoint = path[0];
    let minDistance = this.calculateDistance(point, path[0]);

    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];
      
      // Find closest point on this segment
      const A = point.x - segmentStart.x;
      const B = point.y - segmentStart.y;
      const C = segmentEnd.x - segmentStart.x;
      const D = segmentEnd.y - segmentStart.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      let param = 0;
      if (lenSq !== 0) {
        param = Math.max(0, Math.min(1, dot / lenSq));
      }

      const segmentPoint = {
        x: segmentStart.x + param * C,
        y: segmentStart.y + param * D
      };

      const distance = this.calculateDistance(point, segmentPoint);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = segmentPoint;
      }
    }

    return closestPoint;
  }

  private calculateFloorPlanBounds() {
    const allPoints = this.floorPlan.walls.flatMap(wall => [wall.start, wall.end]);
    
    return {
      minX: Math.min(...allPoints.map(p => p.x)),
      maxX: Math.max(...allPoints.map(p => p.x)),
      minY: Math.min(...allPoints.map(p => p.y)),
      maxY: Math.max(...allPoints.map(p => p.y))
    };
  }

  private distanceSegmentToSegment(seg1: { start: Point; end: Point }, wall: { start: Point; end: Point }): number {
    // Simplified distance calculation between two line segments
    const distances = [
      this.distancePointToSegment(seg1.start, wall.start, wall.end),
      this.distancePointToSegment(seg1.end, wall.start, wall.end),
      this.distancePointToSegment(wall.start, seg1.start, seg1.end),
      this.distancePointToSegment(wall.end, seg1.start, seg1.end)
    ];
    
    return Math.min(...distances);
  }

  private segmentIntersectsPolygon(segment: { start: Point; end: Point }, polygon: Point[]): boolean {
    // Check if segment intersects any edge of the polygon
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      if (this.segmentsIntersect(segment.start, segment.end, polygon[i], polygon[j])) {
        return true;
      }
    }
    return false;
  }

  private segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const d1 = this.ccw(p3, p4, p1);
    const d2 = this.ccw(p3, p4, p2);
    const d3 = this.ccw(p1, p2, p3);
    const d4 = this.ccw(p1, p2, p4);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    
    return false;
  }

  private ccw(A: Point, B: Point, C: Point): number {
    return (C.y - A.y) * (B.x - A.x) - (B.y - A.y) * (C.x - A.x);
  }

  private corridorsOverlap(corridor1: Corridor, corridor2: Corridor): boolean {
    // Check if corridors have overlapping paths
    return corridor1.path.some(point1 => 
      corridor2.path.some(point2 => 
        this.calculateDistance(point1, point2) < (corridor1.width + corridor2.width) / 2
      )
    );
  }

  private mergeCorridor(primary: Corridor, overlapping: Corridor[]): Corridor {
    // Merge overlapping corridors into a single optimized corridor
    const allPoints = [primary, ...overlapping].flatMap(c => c.path);
    const mergedWidth = Math.max(primary.width, ...overlapping.map(c => c.width));
    
    // Simplify path by finding key waypoints
    const simplifiedPath = this.simplifyPath(allPoints);
    
    return {
      id: uuidv4(),
      path: simplifiedPath,
      width: mergedWidth,
      type: primary.type === 'main' ? 'main' : 'secondary',
      length: this.calculatePathLength(simplifiedPath),
      accessibility: primary.accessibility && overlapping.every(c => c.accessibility)
    };
  }

  private simplifyPath(points: Point[]): Point[] {
    if (points.length <= 2) return points;
    
    // Use Douglas-Peucker algorithm for path simplification
    const tolerance = 100; // 10cm tolerance
    return this.douglasPeucker(points, tolerance);
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;
    
    let maxDistance = 0;
    let index = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.distancePointToSegment(points[i], points[0], points[points.length - 1]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, index + 1), tolerance);
      const right = this.douglasPeucker(points.slice(index), tolerance);
      
      return [...left.slice(0, -1), ...right];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }
}