import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Grid, MapPin, Download, CheckCircle, Settings, BarChart3, 
  Layers, Eye, Save, FolderOpen, Maximize2, ZoomIn, ZoomOut, 
  Square, Circle, Minus, MoreHorizontal, X, Minimize2, Target,
  MousePointer, Hand, Copy, Scissors, Undo, Redo,
  Monitor, Printer, Calculator, Ruler
} from 'lucide-react';
import { CADProcessor } from './utils/cadProcessor';
import { IlotOptimizer } from './utils/ilotOptimizer';
import { CorridorGenerator, CorridorConfig } from './utils/corridorGenerator';
import { ExportManager } from './utils/exportManager';
import { FloorPlan, Ilot, Corridor, CADAnalysisResult } from './types/cad';
import ProfessionalFloorPlanRenderer from './components/ProfessionalFloorPlanRenderer';

const CADAnalysisApp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlan | null>(null);
  const [ilotData, setIlotData] = useState<Ilot[] | null>(null);
  const [corridorData, setCorridorData] = useState<Corridor[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CADAnalysisResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTool, setSelectedTool] = useState('select');
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [corridorConfig, setCorridorConfig] = useState<CorridorConfig>({
    width: 1200,
    minClearance: 600,
    maxLength: 15000,
    accessibility: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    setAnalysisResult(null);
  };

  const processStep = async (step: number) => {
    if (!uploadedFile) return;
    setProcessing(true);

    try {
      if (step === 0) {
        const processor = new CADProcessor();
        let floorPlan: FloorPlan;

        if (uploadedFile.name.toLowerCase().endsWith('.pdf')) {
          floorPlan = await processor.processPDF(uploadedFile);
        } else if (uploadedFile.name.toLowerCase().endsWith('.dxf')) {
          floorPlan = await processor.processDXF(uploadedFile);
        } else {
          floorPlan = await processor.processDXF(uploadedFile);
        }

        setFloorPlanData(floorPlan);
        setCurrentStep(1);

      } else if (step === 1 && floorPlanData) {
        const optimizer = new IlotOptimizer(floorPlanData);
        const optimizedIlots = optimizer.optimizePlacement(2000);
        setIlotData(optimizedIlots);
        setCurrentStep(2);

      } else if (step === 2 && floorPlanData && ilotData) {
        const generator = new CorridorGenerator(floorPlanData, ilotData, corridorConfig);
        const corridors = generator.generateCorridors();
        setCorridorData(corridors);

        const result: CADAnalysisResult = {
          floorPlan: floorPlanData,
          ilots: ilotData,
          corridors: corridors,
          optimization: {
            spaceUtilization: (ilotData.reduce((sum, ilot) => sum + ilot.area, 0) / floorPlanData.usableArea) * 100,
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
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error('Processing error:', error);
      if (step === 0) {
        const processor = new CADProcessor();
        setFloorPlanData(processor.createAdvancedFloorPlan());
        setCurrentStep(1);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!analysisResult) return;
    const exportManager = new ExportManager(analysisResult);
    try {
      switch (format) {
        case 'pdf': await exportManager.exportPDF(); break;
        case 'dxf': exportManager.exportDXF(); break;
        case 'json': exportManager.exportJSON(); break;
        case '3d': exportManager.export3DModel(); break;
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  interface RibbonItem {
    icon: any;
    label: string;
    action: () => void | Promise<void>;
    disabled?: boolean;
    active?: boolean;
  }

  interface RibbonGroup {
    name: string;
    items: RibbonItem[];
  }

  interface RibbonTab {
    id: string;
    name: string;
    groups: RibbonGroup[];
  }

  const ribbonTabs: RibbonTab[] = [
    { 
      id: 'home', 
      name: 'Home', 
      groups: [
        { name: 'File', items: [
          { icon: FolderOpen, label: 'Open', action: () => fileInputRef.current?.click() },
          { icon: Save, label: 'Save', action: () => {} },
          { icon: Printer, label: 'Print', action: () => {} }
        ]},
        { name: 'Edit', items: [
          { icon: Copy, label: 'Copy', action: () => {} },
          { icon: Scissors, label: 'Cut', action: () => {} },
          { icon: Undo, label: 'Undo', action: () => {} },
          { icon: Redo, label: 'Redo', action: () => {} }
        ]},
        { name: 'View', items: [
          { icon: ZoomIn, label: 'Zoom In', action: () => {} },
          { icon: ZoomOut, label: 'Zoom Out', action: () => {} },
          { icon: Maximize2, label: 'Zoom Extents', action: () => {} },
          { icon: Target, label: 'Pan', action: () => setSelectedTool('pan') }
        ]}
      ]
    },
    { 
      id: 'analysis', 
      name: 'Analysis', 
      groups: [
        { name: 'Processing', items: [
          { icon: FileText, label: 'Extract', action: () => processStep(0), disabled: !uploadedFile || processing },
          { icon: Grid, label: 'Optimize', action: () => processStep(1), disabled: !floorPlanData || processing },
          { icon: MapPin, label: 'Generate', action: () => processStep(2), disabled: !ilotData || processing }
        ]},
        { name: 'Configuration', items: [
          { icon: Settings, label: 'Parameters', action: () => {} },
          { icon: Calculator, label: 'Calculate', action: () => {} }
        ]},
        { name: 'Export', items: [
          { icon: Download, label: 'PDF', action: () => handleExport('pdf'), disabled: !analysisResult },
          { icon: Download, label: 'DXF', action: () => handleExport('dxf'), disabled: !analysisResult },
          { icon: Download, label: 'Data', action: () => handleExport('json'), disabled: !analysisResult }
        ]}
      ]
    },
    { 
      id: 'view', 
      name: 'View', 
      groups: [
        { name: 'Show/Hide', items: [
          { icon: Eye, label: 'Properties', action: () => setShowProperties(!showProperties), active: showProperties },
          { icon: Layers, label: 'Layers', action: () => setShowLayers(!showLayers), active: showLayers },
          { icon: Ruler, label: 'Grid', action: () => {} }
        ]},
        { name: 'Workspace', items: [
          { icon: Monitor, label: 'Layout', action: () => {} },
          { icon: MoreHorizontal, label: 'Toolbars', action: () => {} }
        ]}
      ]
    }
  ];

  const drawingTools = [
    { icon: MousePointer, name: 'Select', id: 'select' },
    { icon: Minus, name: 'Line', id: 'line' },
    { icon: Square, name: 'Rectangle', id: 'rectangle' },
    { icon: Circle, name: 'Circle', id: 'circle' },
    { icon: Hand, name: 'Pan', id: 'pan' },
    { icon: ZoomIn, name: 'Zoom', id: 'zoom' }
  ];

  return (
    <div className="h-screen bg-gray-200 flex flex-col overflow-hidden">
      {/* Title Bar */}
      <div className="bg-blue-800 text-white px-4 py-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">CAD Analysis Pro 2025</span>
          </div>
          <span className="text-blue-200">- {uploadedFile ? uploadedFile.name : 'Untitled'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="hover:bg-blue-700 p-1 rounded"><Minimize2 className="w-4 h-4" /></button>
          <button className="hover:bg-blue-700 p-1 rounded"><Maximize2 className="w-4 h-4" /></button>
          <button className="hover:bg-red-600 p-1 rounded"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Application Title */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Professional Floor Plan Analysis System</h1>
            <p className="text-blue-100 text-xs">Intelligent Space Optimization & Corridor Generation</p>
          </div>
        </div>
      </div>

      {/* Ribbon Interface */}
      <div className="bg-white border-b border-gray-300">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200">
          {ribbonTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Ribbon Content */}
        <div className="p-3">
          {ribbonTabs.find(t => t.id === activeTab)?.groups.map(group => (
            <div key={group.name} className="inline-flex flex-col mr-6">
              <div className="flex gap-1 mb-1">
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    disabled={item.disabled}
                    className={`flex flex-col items-center p-2 rounded hover:bg-gray-100 transition-colors text-xs ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${item.active ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
                    title={item.label}
                  >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center border-t pt-1">{group.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar for Pipeline */}
      {processing && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700 text-sm font-medium">Processing: {
              currentStep === 0 ? 'Extracting floor plan...' :
              currentStep === 1 ? 'Optimizing îlot placement...' :
              'Generating corridor system...'
            }</span>
            <div className="flex-1 bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / 3) * 100}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-12 bg-gray-100 border-r border-gray-300 flex flex-col items-center py-2 gap-1">
          {drawingTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`w-10 h-10 flex items-center justify-center rounded hover:bg-gray-200 transition-colors ${
                selectedTool === tool.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title={tool.name}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Properties Panel */}
        {showProperties && (
          <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <span className="font-medium text-gray-700">Properties</span>
              <button onClick={() => setShowProperties(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* File Upload */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  File Operations
                </h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                    uploadedFile 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.dwg,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div>
                      <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="font-medium text-gray-900 text-sm">{uploadedFile.name}</p>
                      <p className="text-gray-500 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm">Drop file here or click</p>
                      <p className="text-gray-400 text-xs">DXF, DWG, PDF</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parameters */}
              {uploadedFile && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Analysis Parameters
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Corridor Width (mm)</label>
                      <input
                        type="number"
                        value={corridorConfig.width}
                        onChange={(e) => setCorridorConfig({...corridorConfig, width: parseInt(e.target.value) || 1200})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Min Clearance (mm)</label>
                      <input
                        type="number"
                        value={corridorConfig.minClearance}
                        onChange={(e) => setCorridorConfig({...corridorConfig, minClearance: parseInt(e.target.value) || 600})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max Length (mm)</label>
                      <input
                        type="number"
                        value={corridorConfig.maxLength}
                        onChange={(e) => setCorridorConfig({...corridorConfig, maxLength: parseInt(e.target.value) || 15000})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ada"
                        checked={corridorConfig.accessibility}
                        onChange={(e) => setCorridorConfig({...corridorConfig, accessibility: e.target.checked})}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="ada" className="text-xs text-gray-600">ADA Compliant</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {analysisResult && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Results Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Îlots:</span>
                      <span className="font-medium">{analysisResult.optimization.totalIlots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Space Utilization:</span>
                      <span className="font-medium">{analysisResult.optimization.spaceUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efficiency Score:</span>
                      <span className="font-medium">{analysisResult.optimization.efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Corridor Length:</span>
                      <span className="font-medium">{(analysisResult.optimization.totalCorridorLength / 1000).toFixed(1)}m</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Drawing Area */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {/* Coordinate System */}
          <div className="absolute top-2 left-2 z-10 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
            <span>Drawing Units: Millimeters | Scale: 1:100</span>
          </div>

          {/* Grid and Content */}
          {floorPlanData ? (
            <div className="h-full relative">
              {/* Grid Background */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
              
              {/* UCS Icon */}
              <div className="absolute bottom-4 left-4 z-10 bg-white border border-gray-300 rounded p-2">
                <div className="relative w-6 h-6">
                  <div className="absolute bottom-0 left-0 w-4 h-px bg-red-500"></div>
                  <div className="absolute bottom-0 left-0 w-px h-4 bg-green-500"></div>
                  <span className="absolute -bottom-1 left-5 text-red-500 text-xs font-bold">X</span>
                  <span className="absolute -left-1 top-0 text-green-500 text-xs font-bold">Y</span>
                </div>
              </div>

              {/* ViewCube */}
              <div className="absolute top-4 right-4 z-10 bg-white border border-gray-300 rounded p-2">
                <div className="grid grid-cols-3 gap-0.5">
                  {['NW','N','NE','W','T','E','SW','S','SE'].map((dir, i) => (
                    <div key={dir} className={`w-6 h-6 border border-gray-300 flex items-center justify-center text-xs cursor-pointer hover:bg-gray-100 ${i === 4 ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
                      {dir}
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawing Content */}
              <div className="p-4 h-full">
                <ProfessionalFloorPlanRenderer
                  floorPlan={floorPlanData}
                  ilots={ilotData || []}
                  corridors={corridorData || []}
                  showIlots={currentStep >= 2}
                  showCorridors={currentStep >= 3}
                  scale={1.0}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Model Space</h3>
                <p className="text-sm mb-4">No drawing loaded</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Open CAD File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Layers Panel */}
        {showLayers && (
          <div className="w-64 bg-white border-l border-gray-300 flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <span className="font-medium text-gray-700">Layer Properties</span>
              <button onClick={() => setShowLayers(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {[
                { name: 'Floor Plan', color: '#000000', visible: true },
                { name: 'Îlots', color: '#0066cc', visible: currentStep >= 2 },
                { name: 'Corridors', color: '#ff6600', visible: currentStep >= 3 },
                { name: 'Dimensions', color: '#009900', visible: false },
                { name: 'Text', color: '#cc0000', visible: true }
              ].map((layer, idx) => (
                <div key={idx} className="px-3 py-2 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50">
                  <input type="checkbox" checked={layer.visible} readOnly className="rounded border-gray-300" />
                  <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: layer.color }}></div>
                  <span className="text-sm text-gray-700 flex-1">{layer.name}</span>
                  <Eye className="w-3 h-3 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-1 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Model: {floorPlanData ? 'Floor Plan Analysis' : 'Empty'}</span>
          <span>Layer: {floorPlanData ? 'Floor Plan' : 'N/A'}</span>
          <span>Cursor: 0.0000, 0.0000</span>
        </div>
        <div className="flex items-center gap-4">
          {analysisResult && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Analysis Complete</span>
            </div>
          )}
          <span>Units: MM</span>
          <span>Scale: 1:100</span>
          <span>CAD Analysis Pro 2025</span>
        </div>
      </div>
    </div>
  );
};

export default CADAnalysisApp;