import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Settings, 
  BarChart3, 
  Download, 
  Layers,
  Grid3X3,
  Maximize2,
  Menu,
  Search,
  Save,
  FolderOpen,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { FloorPlan, Ilot, Corridor, AnalysisResults } from './types/cad';
import { CADProcessor } from './utils/cadProcessor';
import { IlotOptimizer } from './utils/ilotOptimizer';
import { CorridorGenerator } from './utils/corridorGenerator';
import { ExportManager } from './utils/exportManager';
import ProfessionalFloorPlanRenderer from './components/ProfessionalFloorPlanRenderer';
import { RealisticVisualization } from './components/RealisticVisualization';

const CADAnalysisApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlan | null>(null);
  const [ilotData, setIlotData] = useState<Ilot[]>([]);
  const [corridorData, setCorridorData] = useState<Corridor[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Process CAD file
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      if (currentStep === 0) {
        const processor = new CADProcessor();
        const floorPlan = processor.createAdvancedFloorPlan();
        setFloorPlanData(floorPlan);
        setCurrentStep(1);
      } else if (currentStep === 1 && floorPlanData) {
        const optimizer = new IlotOptimizer(floorPlanData);
        const ilots = optimizer.optimizeIlotPlacement();
        setIlotData(ilots);
        setCurrentStep(2);
      } else if (currentStep === 2 && floorPlanData && ilotData) {
        const corridorGen = new CorridorGenerator(floorPlanData, ilotData, 1200);
        const corridors = corridorGen.generateCorridors();
        setCorridorData(corridors);

        const results: AnalysisResults = {
          floorPlan: floorPlanData,
          ilots: ilotData,
          corridors,
          optimization: {
            spaceUtilization: ilotData.reduce((sum, ilot) => sum + ilot.area, 0) / floorPlanData.usableArea * 100,
            accessibilityScore: ilotData.filter(ilot => ilot.accessibility).length / ilotData.length * 100,
            clearanceCompliance: 95,
            totalIlots: ilotData.length,
            totalCorridorLength: corridors.reduce((sum, corridor) => sum + corridor.length, 0),
            efficiency: 88
          },
          exportData: {
            dxf: '',
            pdf: new Blob(),
            json: '',
            summary: `Analysis completed with ${ilotData.length} îlots and ${corridors.length} corridors`
          }
        };
        setAnalysisResults(results);
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Grid3X3 className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">CAD Analysis Pro 2025</span>
            </div>

            {/* Menu Items */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">
                <FolderOpen className="w-4 h-4" />
                <span>File</span>
              </div>
              <div className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>Edit</span>
              </div>
              <div className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </div>
              <div className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">
                <BarChart3 className="w-4 h-4" />
                <span>Analysis</span>
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="text-gray-400">Drawing Units: Millimeters | Scale: 1:100</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-750 border-b border-gray-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* File Operations */}
            <div className="flex items-center space-x-1">
              <button className="cad-button">
                <FolderOpen className="w-4 h-4" />
              </button>
              <button className="cad-button">
                <Save className="w-4 h-4" />
              </button>
              <button className="cad-button">
                <Printer className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-600"></div>

            {/* View Controls */}
            <div className="flex items-center space-x-1">
              <button className="cad-button">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="cad-button">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button className="cad-button">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button className="cad-button">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-600"></div>

            {/* Layer Controls */}
            <div className="flex items-center space-x-1">
              <button 
                className={`cad-button ${showLayers ? 'active' : ''}`}
                onClick={() => setShowLayers(!showLayers)}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button 
                className={`cad-button ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Model Space</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Properties Panel */}
        <div className={`bg-gray-850 border-r border-gray-600 transition-all duration-300 ${leftPanelCollapsed ? 'w-8' : 'w-80'} flex flex-col`}>
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            {!leftPanelCollapsed && <span className="font-medium text-sm">Properties</span>}
            <button 
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="text-gray-400 hover:text-white p-1"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* File Operations */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">File Operations</h3>
                <div className="space-y-2">
                  <label className="block">
                    <div className="text-xs text-gray-400 mb-2">Choose File</div>
                    <input
                      type="file"
                      accept=".dxf,.dwg,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="w-full p-3 border-2 border-dashed border-gray-600 rounded text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all text-sm text-gray-400"
                    >
                      <Upload className="w-5 h-5 mx-auto mb-2" />
                      Drop file here or click
                      <div className="text-xs text-gray-500 mt-1">
                        DXF, DWG, PDF
                      </div>
                    </label>
                  </label>
                </div>
              </div>

              {/* Drawing Info */}
              {selectedFile && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Drawing Info</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">File:</span>
                      <span className="text-white">{selectedFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${isProcessing ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isProcessing ? 'Processing...' : 'Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {analysisResults && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Analysis Results</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Space Utilization</span>
                        <span className="text-white">{analysisResults.optimization.spaceUtilization.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Îlots</span>
                        <span className="text-white">{analysisResults.optimization.totalIlots}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Accessibility</span>
                        <span className="text-white">{analysisResults.optimization.accessibilityScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Efficiency</span>
                        <span className="text-white">{analysisResults.optimization.efficiency}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Drawing Area */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          {/* Drawing Canvas */}
          <div className="absolute inset-0">
            {floorPlanData ? (
              <div className="h-full w-full bg-white relative">
                {showGrid && (
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" className="absolute inset-0">
                      <defs>
                        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#666" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                    </svg>
                  </div>
                )}
                <ProfessionalFloorPlanRenderer
                  floorPlan={floorPlanData}
                  ilots={ilotData}
                  corridors={corridorData}
                  showIlots={currentStep >= 2}
                  showCorridors={currentStep >= 3}
                  scale={1.2}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                  <FileText className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No drawing loaded</h3>
                  <p className="text-sm">Upload a CAD file to begin analysis</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Coordinate: 0.00, 0.00</span>
                <span>Layer: 0</span>
                <span>Color: By Layer</span>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white">SNAP</button>
                <button className="text-gray-400 hover:text-white">GRID</button>
                <button className="text-gray-400 hover:text-white">ORTHO</button>
                <button className="text-gray-400 hover:text-white">POLAR</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Analysis Panel */}
        <div className={`bg-gray-850 border-l border-gray-600 transition-all duration-300 ${rightPanelCollapsed ? 'w-8' : 'w-80'} flex flex-col`}>
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <button 
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="text-gray-400 hover:text-white p-1"
            >
              <Menu className="w-4 h-4" />
            </button>
            {!rightPanelCollapsed && <span className="font-medium text-sm">Analysis</span>}
          </div>

          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Progress */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Processing Status</h3>
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 text-xs ${currentStep >= 1 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Floor Plan Loaded</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-xs ${currentStep >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Îlots Optimized</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-xs ${currentStep >= 3 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Corridors Generated</span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              {analysisResults && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Export</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors">
                      Export DXF
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors">
                      Export PDF
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors">
                      Export Analysis Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CADAnalysisApp;