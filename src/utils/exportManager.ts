import { FloorPlan, Ilot, Corridor, CADAnalysisResult } from '../types/cad';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, PageSizes } from 'pdf-lib';

export class ExportManager {
  constructor(private analysisResult: CADAnalysisResult) {}

  async exportPDF(): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText('CAD Analysis Report', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });

    // Add floor plan visualization
    await this.drawFloorPlanToPDF(page, 50, height - 300, 500, 200);
    
    // Add statistics
    this.addStatisticsToPDF(page, 50, height - 350);
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, 'cad-analysis-report.pdf');
  }

  exportDXF(): void {
    const dxfContent = this.generateDXFContent();
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    saveAs(blob, 'floor-plan-optimized.dxf');
  }

  exportJSON(): void {
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        units: this.analysisResult.floorPlan.unit
      },
      floorPlan: this.analysisResult.floorPlan,
      ilots: this.analysisResult.ilots,
      corridors: this.analysisResult.corridors,
      optimization: this.analysisResult.optimization
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    saveAs(blob, 'cad-analysis-data.json');
  }

  export3DModel(): void {
    const obj3DContent = this.generateOBJContent();
    const blob = new Blob([obj3DContent], { type: 'application/obj' });
    saveAs(blob, 'floor-plan-3d.obj');
  }

  private async drawFloorPlanToPDF(page: any, x: number, y: number, width: number, height: number): Promise<void> {
    // Calculate scale to fit floor plan in the given dimensions
    const bounds = this.calculateBounds();
    const scaleX = width / (bounds.maxX - bounds.minX);
    const scaleY = height / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% to leave some margin

    // Draw walls
    this.analysisResult.floorPlan.walls.forEach(wall => {
      const startX = x + (wall.start.x - bounds.minX) * scale;
      const startY = y + (wall.start.y - bounds.minY) * scale;
      const endX = x + (wall.end.x - bounds.minX) * scale;
      const endY = y + (wall.end.y - bounds.minY) * scale;

      page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness: 2,
        color: rgb(0.4, 0.4, 0.4),
      });
    });

    // Draw ilots
    this.analysisResult.ilots.forEach(ilot => {
      const ilotX = x + (ilot.position.x - ilot.width/2 - bounds.minX) * scale;
      const ilotY = y + (ilot.position.y - ilot.height/2 - bounds.minY) * scale;
      const ilotWidth = ilot.width * scale;
      const ilotHeight = ilot.height * scale;

      page.drawRectangle({
        x: ilotX,
        y: ilotY,
        width: ilotWidth,
        height: ilotHeight,
        borderColor: rgb(0.9, 0.2, 0.6),
        borderWidth: 1,
        color: rgb(1, 0.8, 0.8),
      });
    });

    // Draw corridors
    this.analysisResult.corridors.forEach(corridor => {
      for (let i = 0; i < corridor.path.length - 1; i++) {
        const startX = x + (corridor.path[i].x - bounds.minX) * scale;
        const startY = y + (corridor.path[i].y - bounds.minY) * scale;
        const endX = x + (corridor.path[i + 1].x - bounds.minX) * scale;
        const endY = y + (corridor.path[i + 1].y - bounds.minY) * scale;

        page.drawLine({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          thickness: Math.max(1, corridor.width * scale / 1000),
          color: rgb(0.9, 0.3, 0.6),
        });
      }
    });
  }

  private addStatisticsToPDF(page: any, x: number, y: number): void {
    const stats = [
      `Total Area: ${(this.analysisResult.floorPlan.totalArea / 1000000).toFixed(1)} m²`,
      `Usable Area: ${(this.analysisResult.floorPlan.usableArea / 1000000).toFixed(1)} m²`,
      `Number of Ilots: ${this.analysisResult.ilots.length}`,
      `Total Corridor Length: ${(this.analysisResult.optimization.totalCorridorLength / 1000).toFixed(1)} m`,
      `Space Utilization: ${this.analysisResult.optimization.spaceUtilization.toFixed(1)}%`,
      `Accessibility Score: ${this.analysisResult.optimization.accessibilityScore.toFixed(1)}%`,
      `Overall Efficiency: ${this.analysisResult.optimization.efficiency.toFixed(1)}%`
    ];

    stats.forEach((stat, index) => {
      page.drawText(stat, {
        x: x,
        y: y - (index * 20),
        size: 12,
        color: rgb(0, 0, 0),
      });
    });
  }

  private generateDXFContent(): string {
    let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Add walls
    this.analysisResult.floorPlan.walls.forEach((wall, index) => {
      dxf += `0
LINE
5
${index.toString(16).toUpperCase().padStart(3, '0')}
100
AcDbEntity
8
WALLS
100
AcDbLine
10
${wall.start.x.toFixed(3)}
20
${wall.start.y.toFixed(3)}
30
0.0
11
${wall.end.x.toFixed(3)}
21
${wall.end.y.toFixed(3)}
31
0.0
`;
    });

    // Add ilots as rectangles
    this.analysisResult.ilots.forEach((ilot, index) => {
      const corners = [
        { x: ilot.position.x - ilot.width/2, y: ilot.position.y - ilot.height/2 },
        { x: ilot.position.x + ilot.width/2, y: ilot.position.y - ilot.height/2 },
        { x: ilot.position.x + ilot.width/2, y: ilot.position.y + ilot.height/2 },
        { x: ilot.position.x - ilot.width/2, y: ilot.position.y + ilot.height/2 },
      ];

      for (let i = 0; i < 4; i++) {
        const start = corners[i];
        const end = corners[(i + 1) % 4];
        const entityId = (1000 + index * 4 + i).toString(16).toUpperCase();

        dxf += `0
LINE
5
${entityId}
100
AcDbEntity
8
ILOTS
100
AcDbLine
10
${start.x.toFixed(3)}
20
${start.y.toFixed(3)}
30
0.0
11
${end.x.toFixed(3)}
21
${end.y.toFixed(3)}
31
0.0
`;
      }
    });

    // Add corridors
    this.analysisResult.corridors.forEach((corridor, corridorIndex) => {
      corridor.path.forEach((point, pointIndex) => {
        if (pointIndex < corridor.path.length - 1) {
          const start = point;
          const end = corridor.path[pointIndex + 1];
          const entityId = (2000 + corridorIndex * 100 + pointIndex).toString(16).toUpperCase();

          dxf += `0
LINE
5
${entityId}
100
AcDbEntity
8
CORRIDORS
100
AcDbLine
10
${start.x.toFixed(3)}
20
${start.y.toFixed(3)}
30
0.0
11
${end.x.toFixed(3)}
21
${end.y.toFixed(3)}
31
0.0
`;
        }
      });
    });

    dxf += `0
ENDSEC
0
EOF
`;

    return dxf;
  }

  private generateOBJContent(): string {
    let obj = '# CAD Analysis 3D Model\n';
    obj += '# Generated by CAD Analysis Pro\n\n';

    let vertexIndex = 1;

    // Add floor as base
    const bounds = this.calculateBounds();
    const floorHeight = 0;
    
    obj += `# Floor\n`;
    obj += `v ${bounds.minX} ${bounds.minY} ${floorHeight}\n`;
    obj += `v ${bounds.maxX} ${bounds.minY} ${floorHeight}\n`;
    obj += `v ${bounds.maxX} ${bounds.maxY} ${floorHeight}\n`;
    obj += `v ${bounds.minX} ${bounds.maxY} ${floorHeight}\n`;
    obj += `f 1 2 3 4\n\n`;
    vertexIndex += 4;

    // Add walls as vertical extrusions
    obj += `# Walls\n`;
    this.analysisResult.floorPlan.walls.forEach(wall => {
      const wallHeight = 2700; // 2.7m standard height
      const thickness = wall.thickness || 200;

      // Calculate wall direction and perpendicular
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;
      const perpX = -unitY * thickness / 2;
      const perpY = unitX * thickness / 2;

      // Wall vertices (8 vertices for a rectangular prism)
      const vertices = [
        { x: wall.start.x + perpX, y: wall.start.y + perpY, z: 0 },
        { x: wall.start.x - perpX, y: wall.start.y - perpY, z: 0 },
        { x: wall.end.x - perpX, y: wall.end.y - perpY, z: 0 },
        { x: wall.end.x + perpX, y: wall.end.y + perpY, z: 0 },
        { x: wall.start.x + perpX, y: wall.start.y + perpY, z: wallHeight },
        { x: wall.start.x - perpX, y: wall.start.y - perpY, z: wallHeight },
        { x: wall.end.x - perpX, y: wall.end.y - perpY, z: wallHeight },
        { x: wall.end.x + perpX, y: wall.end.y + perpY, z: wallHeight },
      ];

      vertices.forEach(vertex => {
        obj += `v ${vertex.x.toFixed(3)} ${vertex.y.toFixed(3)} ${vertex.z.toFixed(3)}\n`;
      });

      // Wall faces
      const baseIndex = vertexIndex;
      obj += `f ${baseIndex} ${baseIndex + 1} ${baseIndex + 2} ${baseIndex + 3}\n`; // bottom
      obj += `f ${baseIndex + 4} ${baseIndex + 7} ${baseIndex + 6} ${baseIndex + 5}\n`; // top
      obj += `f ${baseIndex} ${baseIndex + 4} ${baseIndex + 5} ${baseIndex + 1}\n`; // side 1
      obj += `f ${baseIndex + 1} ${baseIndex + 5} ${baseIndex + 6} ${baseIndex + 2}\n`; // side 2
      obj += `f ${baseIndex + 2} ${baseIndex + 6} ${baseIndex + 7} ${baseIndex + 3}\n`; // side 3
      obj += `f ${baseIndex + 3} ${baseIndex + 7} ${baseIndex + 4} ${baseIndex}\n`; // side 4

      vertexIndex += 8;
    });

    // Add ilots as rectangular prisms
    obj += `\n# Ilots\n`;
    this.analysisResult.ilots.forEach(ilot => {
      const ilotHeight = 750; // Standard desk height
      const corners = [
        { x: ilot.position.x - ilot.width/2, y: ilot.position.y - ilot.height/2 },
        { x: ilot.position.x + ilot.width/2, y: ilot.position.y - ilot.height/2 },
        { x: ilot.position.x + ilot.width/2, y: ilot.position.y + ilot.height/2 },
        { x: ilot.position.x - ilot.width/2, y: ilot.position.y + ilot.height/2 },
      ];

      // Bottom vertices
      corners.forEach(corner => {
        obj += `v ${corner.x.toFixed(3)} ${corner.y.toFixed(3)} 0\n`;
      });
      
      // Top vertices
      corners.forEach(corner => {
        obj += `v ${corner.x.toFixed(3)} ${corner.y.toFixed(3)} ${ilotHeight}\n`;
      });

      const baseIndex = vertexIndex;
      obj += `f ${baseIndex} ${baseIndex + 1} ${baseIndex + 2} ${baseIndex + 3}\n`; // bottom
      obj += `f ${baseIndex + 4} ${baseIndex + 7} ${baseIndex + 6} ${baseIndex + 5}\n`; // top
      obj += `f ${baseIndex} ${baseIndex + 4} ${baseIndex + 5} ${baseIndex + 1}\n`; // side 1
      obj += `f ${baseIndex + 1} ${baseIndex + 5} ${baseIndex + 6} ${baseIndex + 2}\n`; // side 2
      obj += `f ${baseIndex + 2} ${baseIndex + 6} ${baseIndex + 7} ${baseIndex + 3}\n`; // side 3
      obj += `f ${baseIndex + 3} ${baseIndex + 7} ${baseIndex + 4} ${baseIndex}\n`; // side 4

      vertexIndex += 8;
    });

    return obj;
  }

  private calculateBounds() {
    const allPoints = [
      ...this.analysisResult.floorPlan.walls.flatMap(wall => [wall.start, wall.end]),
      ...this.analysisResult.ilots.map(ilot => ilot.position),
      ...this.analysisResult.corridors.flatMap(corridor => corridor.path)
    ];

    return {
      minX: Math.min(...allPoints.map(p => p.x)),
      maxX: Math.max(...allPoints.map(p => p.x)),
      minY: Math.min(...allPoints.map(p => p.y)),
      maxY: Math.max(...allPoints.map(p => p.y))
    };
  }
}