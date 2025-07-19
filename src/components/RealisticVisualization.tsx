import React from 'react';
import { FloorPlan, Ilot, Corridor } from '../types/cad';

interface RealisticVisualizationProps {
  floorPlan: FloorPlan;
  ilots: Ilot[];
  corridors: Corridor[];
  width?: number;
  height?: number;
}

export const RealisticVisualization: React.FC<RealisticVisualizationProps> = ({
  floorPlan,
  ilots,
  corridors,
  width = 600,
  height = 400
}) => {
  // Calculate bounds and scale
  const allPoints = [
    ...floorPlan.walls.flatMap(wall => [wall.start, wall.end]),
    ...ilots.map(ilot => ilot.position)
  ];

  const bounds = {
    minX: Math.min(...allPoints.map(p => p.x)),
    maxX: Math.max(...allPoints.map(p => p.x)),
    minY: Math.min(...allPoints.map(p => p.y)),
    maxY: Math.max(...allPoints.map(p => p.y))
  };

  const scaleX = (width - 40) / (bounds.maxX - bounds.minX);
  const scaleY = (height - 40) / (bounds.maxY - bounds.minY);
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const offsetX = 20 + (width - (bounds.maxX - bounds.minX) * scale) / 2;
  const offsetY = 20 + (height - (bounds.maxY - bounds.minY) * scale) / 2;

  const transformX = (x: number) => offsetX + (x - bounds.minX) * scale;
  const transformY = (y: number) => offsetY + (y - bounds.minY) * scale;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Realistic Office Layout</h3>
      <svg width={width} height={height} className="border border-gray-300 bg-gray-50">
        {/* Floor background */}
        <rect width={width} height={height} fill="#f9fafb" />
        
        {/* Grid pattern for office feel */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Walls */}
        {floorPlan.walls.map((wall, idx) => (
          <line
            key={`wall-${idx}`}
            x1={transformX(wall.start.x)}
            y1={transformY(wall.start.y)}
            x2={transformX(wall.end.x)}
            y2={transformY(wall.end.y)}
            stroke="#374151"
            strokeWidth={Math.max(2, wall.thickness * scale / 50)}
            strokeLinecap="round"
          />
        ))}

        {/* Restricted Areas */}
        {floorPlan.restrictedAreas.map((area, idx) => {
          if (area.bounds.length >= 4) {
            const minX = Math.min(...area.bounds.map(p => p.x));
            const minY = Math.min(...area.bounds.map(p => p.y));
            const maxX = Math.max(...area.bounds.map(p => p.x));
            const maxY = Math.max(...area.bounds.map(p => p.y));
            
            return (
              <rect
                key={`restricted-${idx}`}
                x={transformX(minX)}
                y={transformY(minY)}
                width={(maxX - minX) * scale}
                height={(maxY - minY) * scale}
                fill="#dbeafe"
                fillOpacity="0.6"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                rx="4"
              />
            );
          }
          return null;
        })}

        {/* Corridor zones (background) */}
        {corridors.map((corridor, idx) => {
          return corridor.path.map((point, pointIdx) => {
            if (pointIdx < corridor.path.length - 1) {
              const nextPoint = corridor.path[pointIdx + 1];
              const width = corridor.width * scale / 10;
              
              return (
                <line
                  key={`corridor-bg-${idx}-${pointIdx}`}
                  x1={transformX(point.x)}
                  y1={transformY(point.y)}
                  x2={transformX(nextPoint.x)}
                  y2={transformY(nextPoint.y)}
                  stroke="#fdf2f8"
                  strokeWidth={width}
                  strokeLinecap="round"
                />
              );
            }
            return null;
          });
        })}

        {/* Îlots with realistic office furniture appearance */}
        {ilots.map((ilot, idx) => {
          const x = transformX(ilot.position.x - ilot.width / 2);
          const y = transformY(ilot.position.y - ilot.height / 2);
          const w = ilot.width * scale / 10;
          const h = ilot.height * scale / 10;
          
          return (
            <g key={`ilot-${idx}`}>
              {/* Îlot base */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#f3e8ff"
                stroke="#a855f7"
                strokeWidth="1.5"
                rx="6"
                opacity="0.9"
              />
              
              {/* Desk representation */}
              <rect
                x={x + w * 0.1}
                y={y + h * 0.1}
                width={w * 0.8}
                height={h * 0.8}
                fill="#e5e7eb"
                stroke="#6b7280"
                strokeWidth="1"
                rx="3"
              />
              
              {/* Chair indication */}
              <circle
                cx={x + w * 0.5}
                cy={y + h * 0.8}
                r={Math.min(w, h) * 0.15}
                fill="#9ca3af"
                stroke="#4b5563"
                strokeWidth="0.5"
              />
              
              {/* Îlot ID */}
              <text
                x={x + w / 2}
                y={y + h / 2}
                fontSize={Math.max(8, Math.min(12, w / 8))}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#6b7280"
                fontWeight="bold"
              >
                {ilot.type.charAt(0).toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Corridor paths with direction indicators */}
        {corridors.map((corridor, idx) => {
          return corridor.path.map((point, pointIdx) => {
            if (pointIdx < corridor.path.length - 1) {
              const nextPoint = corridor.path[pointIdx + 1];
              const width = Math.max(2, corridor.width * scale / 200);
              
              return (
                <g key={`corridor-${idx}-${pointIdx}`}>
                  <line
                    x1={transformX(point.x)}
                    y1={transformY(point.y)}
                    x2={transformX(nextPoint.x)}
                    y2={transformY(nextPoint.y)}
                    stroke="#ec4899"
                    strokeWidth={width}
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            }
            return null;
          });
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
          </marker>
        </defs>

        {/* Doors */}
        {floorPlan.doors.map((door, idx) => (
          <g key={`door-${idx}`}>
            <rect
              x={transformX(door.position.x - door.width / 2)}
              y={transformY(door.position.y - door.height / 2)}
              width={door.width * scale / 10}
              height={door.height * scale / 10}
              fill="#fef2f2"
              stroke="#ef4444"
              strokeWidth="2"
              rx="2"
            />
            <text
              x={transformX(door.position.x)}
              y={transformY(door.position.y)}
              fontSize="8"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ef4444"
              fontWeight="bold"
            >
              D
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span>Walls</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 border border-purple-500 rounded"></div>
          <span>Îlots</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-pink-500 rounded"></div>
          <span>Corridors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-500 border-dashed rounded"></div>
          <span>Restricted</span>
        </div>
      </div>
    </div>
  );
};