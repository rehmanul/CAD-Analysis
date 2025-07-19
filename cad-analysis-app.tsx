import React, { useState, useRef } from 'react';
import { Upload, FileText, Layout, GitBranch, Download, Zap, Eye, Grid, MapPin } from 'lucide-react';

const CADAnalysisApp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [floorPlanData, setFloorPlanData] = useState(null);
  const [ilotData, setIlotData] = useState(null);
  const [corridorData, setCorridorData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef();

  const steps = [
    { title: 'Floor Plan Extraction', icon: Layout, color: 'blue' },
    { title: 'Îlot Placement', icon: Grid, color: 'green' },
    { title: 'Corridor Generation', icon: GitBranch, color: 'purple' }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!['application/pdf', 'image/vnd.dxf', 'application/acad'].includes(file.type) && 
        !file.name.toLowerCase().match(/\.(dxf|dwg|pdf)$/)) {
      alert('Please upload a DXF, DWG, or PDF file');
      return;
    }

    setUploadedFile(file);
    setCurrentStep(0);
    setFloorPlanData(null);
    setIlotData(null);
    setCorridorData(null);
  };

  const processStep = async (step) => {
    setProcessing(true);
    
    // Simulate processing time for each step
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (step === 0) {
      // Floor plan extraction
      const mockFloorPlan = {
        walls: [
          { x1: 50, y1: 50, x2: 350, y2: 50, thickness: 4 },
          { x1: 350, y1: 50, x2: 350, y2: 250, thickness: 4 },
          { x1: 350, y1: 250, x2: 50, y2: 250, thickness: 4 },
          { x1: 50, y1: 250, x2: 50, y2: 50, thickness: 4 },
          { x1: 200, y1: 50, x2: 200, y2: 150, thickness: 4 }
        ],
        doors: [
          { x: 125, y: 50, width: 30, swing: 'in' },
          { x: 275, y: 50, width: 30, swing: 'in' }
        ],
        restrictedAreas: [
          { x: 60, y: 60, width: 80, height: 40, type: 'NO_ENTRY' }
        ],
        entranceExits: [
          { x: 125, y: 45, width: 30, height: 10, type: 'ENTRANCE' }
        ],
        scale: { factor: 1, unit: 'meters' },
        totalArea: 15000 // in mm²
      };
      setFloorPlanData(mockFloorPlan);
      setCurrentStep(1);
    } else if (step === 1) {
      // Îlot placement
      const mockIlots = {
        ilots: [
          { id: 1, x: 80, y: 80, width: 60, height: 40, area: 5.5, type: 'small' },
          { id: 2, x: 220, y: 80, width: 80, height: 50, area: 7.5, type: 'medium' },
          { id: 3, x: 80, y: 160, width: 100, height: 60, area: 12.0, type: 'large' },
          { id: 4, x: 220, y: 160, width: 70, height: 45, area: 6.2, type: 'small' }
        ],
        optimization: {
          spaceUtilization: 78,
          clearanceCompliance: 95,
          accessibility: 'Full'
        },
        totalUsableArea: 120.5
      };
      setIlotData(mockIlots);
      setCurrentStep(2);
    } else if (step === 2) {
      // Corridor generation
      const mockCorridors = {
        corridors: [
          { from: { x: 140, y: 100 }, to: { x: 260, y: 105 }, width: 4 },
          { from: { x: 130, y: 190 }, to: { x: 255, y: 180 }, width: 4 },
          { from: { x: 200, y: 105 }, to: { x: 200, y: 180 }, width: 4 }
        ],
        pathOptimization: {
          totalLength: 45.2,
          efficiency: 92,
          accessibility: 'Compliant'
        },
        connections: 8
      };
      setCorridorData(mockCorridors);
    }
    
    setProcessing(false);
  };

  const FloorPlanVisualization = () => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Extracted Floor Plan</h3>
      <svg width="400" height="300" className="border border-gray-300">
        {/* Background */}
        <rect width="400" height="300" fill="#f8f9fa" />
        
        {floorPlanData && (
          <>
            {/* Walls */}
            {floorPlanData.walls.map((wall, idx) => (
              <line
                key={idx}
                x1={wall.x1}
                y1={wall.y1}
                x2={wall.x2}
                y2={wall.y2}
                stroke="#6b7280"
                strokeWidth={wall.thickness}
              />
            ))}
            
            {/* Restricted Areas */}
            {floorPlanData.restrictedAreas.map((area, idx) => (
              <rect
                key={idx}
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                fill="#3b82f6"
                fillOpacity="0.3"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            ))}
            
            {/* Entrance/Exit */}
            {floorPlanData.entranceExits.map((entrance, idx) => (
              <rect
                key={idx}
                x={entrance.x}
                y={entrance.y}
                width={entrance.width}
                height={entrance.height}
                fill="#ef4444"
                fillOpacity="0.6"
              />
            ))}
            
            {/* Labels */}
            <text x="100" y="85" fontSize="12" fill="#3b82f6" fontWeight="bold">NO ENTRY</text>
            <text x="125" y="40" fontSize="12" fill="#ef4444" fontWeight="bold">ENTRANCE</text>
          </>
        )}
      </svg>
      
      {floorPlanData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-2 rounded">
            <strong>Total Area:</strong> {(floorPlanData.totalArea / 1000000).toFixed(1)} m²
          </div>
          <div className="bg-green-50 p-2 rounded">
            <strong>Walls Detected:</strong> {floorPlanData.walls.length}
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <strong>Openings:</strong> {floorPlanData.doors.length}
          </div>
        </div>
      )}
    </div>
  );

  const IlotVisualization = () => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Îlot Placement Analysis</h3>
      <svg width="400" height="300" className="border border-gray-300">
        {/* Background floor plan */}
        <rect width="400" height="300" fill="#f8f9fa" />
        
        {floorPlanData && (
          <>
            {/* Walls (lighter) */}
            {floorPlanData.walls.map((wall, idx) => (
              <line
                key={idx}
                x1={wall.x1}
                y1={wall.y1}
                x2={wall.x2}
                y2={wall.y2}
                stroke="#d1d5db"
                strokeWidth={wall.thickness}
              />
            ))}
            
            {/* Îlots */}
            {ilotData && ilotData.ilots.map((ilot, idx) => (
              <g key={idx}>
                <rect
                  x={ilot.x}
                  y={ilot.y}
                  width={ilot.width}
                  height={ilot.height}
                  fill="#fecaca"
                  fillOpacity="0.6"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <text
                  x={ilot.x + ilot.width/2}
                  y={ilot.y + ilot.height/2}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#7f1d1d"
                  fontWeight="bold"
                >
                  {ilot.area}m²
                </text>
              </g>
            ))}
          </>
        )}
      </svg>
      
      {ilotData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-pink-50 p-2 rounded">
            <strong>Îlots Placed:</strong> {ilotData.ilots.length}
          </div>
          <div className="bg-green-50 p-2 rounded">
            <strong>Space Utilization:</strong> {ilotData.optimization.spaceUtilization}%
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <strong>Usable Area:</strong> {ilotData.totalUsableArea}m²
          </div>
        </div>
      )}
    </div>
  );

  const CorridorVisualization = () => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Corridor Network Analysis</h3>
      <svg width="400" height="300" className="border border-gray-300">
        {/* Background */}
        <rect width="400" height="300" fill="#f8f9fa" />
        
        {floorPlanData && (
          <>
            {/* Walls (lighter) */}
            {floorPlanData.walls.map((wall, idx) => (
              <line
                key={idx}
                x1={wall.x1}
                y1={wall.y1}
                x2={wall.x2}
                y2={wall.y2}
                stroke="#e5e7eb"
                strokeWidth={wall.thickness}
              />
            ))}
            
            {/* Îlots (lighter) */}
            {ilotData && ilotData.ilots.map((ilot, idx) => (
              <rect
                key={idx}
                x={ilot.x}
                y={ilot.y}
                width={ilot.width}
                height={ilot.height}
                fill="#fecaca"
                fillOpacity="0.3"
                stroke="#fca5a5"
                strokeWidth="1"
              />
            ))}
            
            {/* Corridors */}
            {corridorData && corridorData.corridors.map((corridor, idx) => (
              <line
                key={idx}
                x1={corridor.from.x}
                y1={corridor.from.y}
                x2={corridor.to.x}
                y2={corridor.to.y}
                stroke="#ec4899"
                strokeWidth={corridor.width}
                markerEnd="url(#arrowhead)"
              />
            ))}
            
            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
              </marker>
            </defs>
          </>
        )}
      </svg>
      
      {corridorData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-purple-50 p-2 rounded">
            <strong>Total Length:</strong> {corridorData.pathOptimization.totalLength}m
          </div>
          <div className="bg-green-50 p-2 rounded">
            <strong>Efficiency:</strong> {corridorData.pathOptimization.efficiency}%
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <strong>Connections:</strong> {corridorData.connections}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                CAD Analysis Pro
              </h1>
              <p className="text-gray-600 mt-2">Professional DXF/DWG/PDF Floor Plan Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Processing Engine</div>
                <div className="text-lg font-semibold text-green-600 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Ultra High Performance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload CAD File
          </h2>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".dxf,.dwg,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadedFile ? (
              <div className="text-green-600">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg">Drop your CAD file here or click to browse</p>
                <p className="text-sm">Supports DXF, DWG, and PDF formats</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Steps */}
        {uploadedFile && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Processing Pipeline</h2>
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isActive 
                          ? `bg-${step.color}-100 text-${step.color}-600` 
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? `text-${step.color}-600` : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                    <button
                      onClick={() => processStep(index)}
                      disabled={processing || (index > 0 && !floorPlanData) || (index > 1 && !ilotData)}
                      className={`mt-2 px-4 py-2 text-sm rounded-md transition-colors ${
                        processing 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : `bg-${step.color}-100 text-${step.color}-700 hover:bg-${step.color}-200`
                      }`}
                    >
                      {processing && index === currentStep ? 'Processing...' : 
                       isCompleted ? 'Completed' : 'Process'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {floorPlanData && <FloorPlanVisualization />}
          {ilotData && <IlotVisualization />}
          {corridorData && <CorridorVisualization />}
        </div>

        {/* Export Options */}
        {corridorData && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Results
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Export PDF Report
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Export DXF File
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                Export 3D Model
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Export Data JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CADAnalysisApp;