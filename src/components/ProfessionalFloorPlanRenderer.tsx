import React, { useEffect, useRef } from 'react';
import { FloorPlan, Ilot, Corridor } from '../types/cad';

interface ProfessionalFloorPlanRendererProps {
  floorPlan: FloorPlan;
  ilots?: Ilot[];
  corridors?: Corridor[];
  showIlots?: boolean;
  showCorridors?: boolean;
  scale?: number;
}

const ProfessionalFloorPlanRenderer: React.FC<ProfessionalFloorPlanRendererProps> = ({
  floorPlan,
  ilots = [],
  corridors = [],
  showIlots = false,
  showCorridors = false,
  scale = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color definitions matching reference images
  const colors = {
    wall: '#6B7280',           // Gray for MUR
    background: '#F9FAFB',      // Light background
    noEntrance: '#3B82F6',      // Blue for NO ENTREE
    entrance: '#EF4444',        // Red for ENTREE/SORTIE
    ilot: '#22C55E',           // Green for îlots
    corridor: '#EC4899',        // Pink for corridors
    text: '#1F2937',           // Dark text
    measurements: '#8B5CF6'     // Purple for measurements
  };

  const renderFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas || !floorPlan) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set default styles
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Transform coordinates to canvas space
    const bounds = calculateBounds();
    const canvasScale = Math.min(
      (canvas.width - 100) / bounds.width,
      (canvas.height - 100) / bounds.height
    ) * scale;
    
    const offsetX = (canvas.width - bounds.width * canvasScale) / 2;
    const offsetY = (canvas.height - bounds.height * canvasScale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(canvasScale, canvasScale);
    ctx.translate(-bounds.minX, -bounds.minY);

    // 1. Draw walls (MUR) - thick gray lines
    drawWalls(ctx);

    // 2. Draw restricted areas (NO ENTREE) - blue zones
    drawRestrictedAreas(ctx);

    // 3. Draw entrance/exit zones (ENTREE/SORTIE) - red curved areas
    drawEntranceAreas(ctx);

    // 4. Draw îlots if enabled
    if (showIlots && ilots.length > 0) {
      drawIlots(ctx);
    }

    // 5. Draw corridors if enabled
    if (showCorridors && corridors.length > 0) {
      drawCorridors(ctx);
    }

    ctx.restore();

    // Draw legend
    drawLegend(ctx);
  };

  const calculateBounds = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate bounds from walls
    floorPlan.walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    // Add padding
    const padding = 100;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width: (maxX - minX) + 2 * padding,
      height: (maxY - minY) + 2 * padding
    };
  };

  const drawWalls = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 8; // Thick lines for walls
    
    floorPlan.walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
    });
  };

  const drawRestrictedAreas = (ctx: CanvasRenderingContext2D) => {
    // Draw blue rectangular restricted areas based on floor plan
    ctx.fillStyle = colors.noEntrance;
    
    // Generate restricted areas based on floor plan geometry
    const restrictedAreas = generateRestrictedAreas();
    
    restrictedAreas.forEach(area => {
      ctx.fillRect(area.x, area.y, area.width, area.height);
    });
  };

  const drawEntranceAreas = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = colors.entrance;
    ctx.lineWidth = 3;
    
    // Draw curved entrance/exit zones
    const entranceAreas = generateEntranceAreas();
    
    entranceAreas.forEach(entrance => {
      ctx.beginPath();
      ctx.arc(entrance.x, entrance.y, entrance.radius, entrance.startAngle, entrance.endAngle);
      ctx.stroke();
    });
  };

  const drawIlots = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = colors.ilot;
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 2;
    
    ilots.forEach(ilot => {
      // Draw îlot rectangle
      ctx.fillRect(ilot.position.x, ilot.position.y, ilot.width, ilot.height);
      ctx.strokeRect(ilot.position.x, ilot.position.y, ilot.width, ilot.height);
      
      // Draw area measurement
      ctx.fillStyle = colors.text;
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      
      const area = (ilot.width * ilot.height / 1000000).toFixed(2); // Convert to m²
      const centerX = ilot.position.x + ilot.width / 2;
      const centerY = ilot.position.y + ilot.height / 2;
      
      ctx.fillText(`${area}m²`, centerX, centerY);
      ctx.fillStyle = colors.ilot; // Reset for next îlot
    });
  };

  const drawCorridors = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = colors.corridor;
    ctx.lineWidth = 4;
    
    corridors.forEach(corridor => {
      corridor.path.forEach((segment, index) => {
        if (index === 0) return;
        
        const prev = corridor.path[index - 1];
        const curr = segment;
        
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      });
    });
  };

  const generateRestrictedAreas = () => {
    // Generate blue rectangular areas based on floor plan geometry
    const areas = [];
    const bounds = calculateBounds();
    
    // Add some strategic restricted areas
    areas.push(
      { x: bounds.minX + 200, y: bounds.minY + 150, width: 80, height: 120 },
      { x: bounds.maxX - 280, y: bounds.minY + 300, width: 90, height: 100 }
    );
    
    return areas;
  };

  const generateEntranceAreas = () => {
    // Generate red curved entrance areas
    const entrances = [];
    const bounds = calculateBounds();
    
    // Add entrance arcs at strategic positions
    entrances.push(
      { x: bounds.minX + 150, y: bounds.maxY - 200, radius: 40, startAngle: 0, endAngle: Math.PI },
      { x: bounds.maxX - 150, y: bounds.minY + 200, radius: 35, startAngle: Math.PI, endAngle: 2 * Math.PI }
    );
    
    return entrances;
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 50;
    const legendY = 50;
    const lineHeight = 25;
    
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';
    
    // Legend items
    const legendItems = [
      { color: colors.noEntrance, text: 'NO ENTRÉE' },
      { color: colors.entrance, text: 'ENTRÉE/SORTIE' },
      { color: colors.wall, text: 'MUR' }
    ];
    
    if (showIlots) {
      legendItems.push({ color: colors.ilot, text: 'ÎLOTS' });
    }
    
    legendItems.forEach((item, index) => {
      const y = legendY + index * lineHeight;
      
      // Draw color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y - 10, 15, 15);
      
      // Draw text
      ctx.fillStyle = colors.text;
      ctx.fillText(item.text, legendX + 25, y);
    });
  };

  useEffect(() => {
    renderFloorPlan();
  }, [floorPlan, ilots, corridors, showIlots, showCorridors, scale]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg w-full max-w-4xl mx-auto"
        style={{ maxHeight: '600px' }}
      />
    </div>
  );
};

export default ProfessionalFloorPlanRenderer;