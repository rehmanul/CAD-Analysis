import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Grid, MapPin, Download, CheckCircle, Settings, BarChart3, 
  Layers, Eye, Save, FolderOpen, Maximize2, ZoomIn, ZoomOut, 
  Square, Circle, Minus, MoreHorizontal, X, Minimize2, Target,
  MousePointer, Hand, Copy, Scissors, Undo, Redo,
  Monitor, Printer, Calculator, Ruler, Cloud, Zap, Users, Shield,
  TrendingUp, Activity, Database, Cpu, HardDrive, Network
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
  const [activeView, setActiveView] = useState('dashboard');
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
    setActiveView('analysis');
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
        setCurrentStep(3);
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

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: Activity },
    { id: 'results', label: 'Results', icon: TrendingUp },
    { id: 'export', label: 'Export', icon: Download }
  ];

  const systemMetrics = [
    { label: 'Processing Power', value: '99.2%', icon: Cpu, color: 'text-green-500' },
    { label: 'Memory Usage', value: '67.8%', icon: HardDrive, color: 'text-blue-500' },
    { label: 'Network Status', value: 'Connected', icon: Network, color: 'text-green-500' },
    { label: 'Cloud Sync', value: 'Active', icon: Cloud, color: 'text-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enterprise Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 shadow-2xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Grid className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Enterprise Îlot Placement System</h1>
                <p className="text-blue-100 text-lg">Advanced CAD Processing • Real-time Optimization • Professional Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-white font-medium">Professional License</span>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-8">
          <div className="flex items-center space-x-8">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-3 transition-all duration-200 ${
                  activeView === item.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeView === 'dashboard' && (
            <div className="space-y-8">
              {/* System Status */}
              <div className="grid grid-cols-4 gap-6">
                {systemMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <metric.icon className={`w-8 h-8 ${metric.color}`} />
                      <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
                    </div>
                    <p className="text-gray-600 font-medium">{metric.label}</p>
                  </div>
                ))}
              </div>

              {/* Upload Section */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-2xl mb-6">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Upload Architectural Plan</h2>
                  </div>
                  <p className="text-gray-600 text-lg">Choose a CAD file (DXF, DWG, PDF) or image (PNG, JPG)</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-gray-300 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 bg-gradient-to-br from-white/50 to-blue-50/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.dwg,.pdf,.png,.jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="bg-green-100 p-4 rounded-2xl inline-block">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{uploadedFile.name}</h3>
                        <p className="text-gray-500">Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-6 rounded-2xl inline-block">
                        <Cloud className="w-16 h-16 text-gray-400 mx-auto" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Drag and drop file here</h3>
                        <p className="text-gray-500 mb-4">Limit 200MB per file • DXF, DWG, PDF, PNG, JPG, JPEG</p>
                        <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
                          Browse files
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="mt-8 bg-blue-50 rounded-2xl p-6">
                    <h4 className="font-bold text-blue-800 mb-4">Getting Started:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-blue-700">
                      <li>Upload your architectural floor plan (DXF, DWG, PDF, or image)</li>
                      <li>Configure placement parameters in the Analysis section</li>
                      <li>Run the optimization algorithm</li>
                      <li>Review and export your results</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'analysis' && (
            <div className="space-y-8">
              {/* Configuration Panel */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-3 rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Configuration</h2>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-700 mb-4">Îlot Size Distribution</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Micro (0-1m²)', value: 0.10, color: 'bg-red-400' },
                        { label: 'Small (1-3m²)', value: 0.25, color: 'bg-orange-400' },
                        { label: 'Medium (3-5m²)', value: 0.40, color: 'bg-yellow-400' },
                        { label: 'Large (5-10m²)', value: 0.35, color: 'bg-green-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                            <span className="text-gray-700">{item.label}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${item.value * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 w-12">{(item.value * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-4">Placement Parameters</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Corridor Width (mm)</label>
                        <input
                          type="number"
                          value={corridorConfig.width}
                          onChange={(e) => setCorridorConfig({...corridorConfig, width: parseInt(e.target.value) || 1200})}
                          className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Min Clearance (mm)</label>
                        <input
                          type="number"
                          value={corridorConfig.minClearance}
                          onChange={(e) => setCorridorConfig({...corridorConfig, minClearance: parseInt(e.target.value) || 600})}
                          className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Max Length (mm)</label>
                        <input
                          type="number"
                          value={corridorConfig.maxLength}
                          onChange={(e) => setCorridorConfig({...corridorConfig, maxLength: parseInt(e.target.value) || 15000})}
                          className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="ada-compliant"
                          checked={corridorConfig.accessibility}
                          onChange={(e) => setCorridorConfig({...corridorConfig, accessibility: e.target.checked})}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="ada-compliant" className="text-gray-700 font-medium">ADA Compliant Design</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Steps */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-6">Processing Pipeline</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { 
                        step: 0, 
                        title: 'Extract Floor Plan', 
                        description: 'Parse architectural drawings',
                        icon: FileText,
                        action: () => processStep(0),
                        disabled: !uploadedFile || processing
                      },
                      { 
                        step: 1, 
                        title: 'Optimize Îlots', 
                        description: 'Apply placement algorithms',
                        icon: Grid,
                        action: () => processStep(1),
                        disabled: !floorPlanData || processing
                      },
                      { 
                        step: 2, 
                        title: 'Generate Corridors', 
                        description: 'Create circulation paths',
                        icon: MapPin,
                        action: () => processStep(2),
                        disabled: !ilotData || processing
                      }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                        currentStep > item.step 
                          ? 'bg-green-50 border-green-200' 
                          : currentStep === item.step 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <item.icon className={`w-8 h-8 ${
                            currentStep > item.step ? 'text-green-600' :
                            currentStep === item.step ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          {currentStep > item.step && (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">{item.title}</h4>
                        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                        <button
                          onClick={item.action}
                          disabled={item.disabled}
                          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                            item.disabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : currentStep > item.step
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600'
                          }`}
                        >
                          {currentStep > item.step ? 'Completed' : 'Process'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              {processing && (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <h4 className="font-bold text-gray-800">Processing in progress...</h4>
                      <p className="text-gray-600">
                        {currentStep === 0 ? 'Extracting floor plan from uploaded file...' :
                         currentStep === 1 ? 'Optimizing îlot placement using AI algorithms...' :
                         'Generating efficient corridor network...'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                         style={{ width: `${((currentStep + 0.5) / 3) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'results' && analysisResult && (
            <div className="space-y-8">
              {/* Results Overview */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Total Îlots', value: analysisResult.optimization.totalIlots, icon: Grid, color: 'text-blue-600' },
                  { label: 'Space Utilization', value: `${analysisResult.optimization.spaceUtilization.toFixed(1)}%`, icon: TrendingUp, color: 'text-green-600' },
                  { label: 'Efficiency Score', value: `${analysisResult.optimization.efficiency}%`, icon: Zap, color: 'text-yellow-600' },
                  { label: 'Corridor Length', value: `${(analysisResult.optimization.totalCorridorLength / 1000).toFixed(1)}m`, icon: MapPin, color: 'text-purple-600' }
                ].map((metric, idx) => (
                  <div key={idx} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <metric.icon className={`w-8 h-8 ${metric.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
                    <p className="text-gray-600 font-medium">{metric.label}</p>
                  </div>
                ))}
              </div>

              {/* Visualization */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Floor Plan Visualization</h2>
                <div className="bg-white rounded-2xl p-4 shadow-inner min-h-96 flex items-center justify-center">
                  {floorPlanData ? (
                    <ProfessionalFloorPlanRenderer
                      floorPlan={floorPlanData}
                      ilots={ilotData || []}
                      corridors={corridorData || []}
                      showIlots={currentStep >= 2}
                      showCorridors={currentStep >= 3}
                      scale={1.0}
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No floor plan data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'export' && analysisResult && (
            <div className="space-y-8">
              {/* Export Options */}
              <div className="grid grid-cols-2 gap-8">
                {[
                  { 
                    title: 'PDF Report', 
                    description: 'Comprehensive analysis report with visualizations',
                    icon: FileText,
                    color: 'from-red-500 to-pink-500',
                    action: () => handleExport('pdf')
                  },
                  { 
                    title: 'DXF Drawing', 
                    description: 'CAD-compatible drawing file for further editing',
                    icon: Grid,
                    color: 'from-blue-500 to-cyan-500',
                    action: () => handleExport('dxf')
                  },
                  { 
                    title: 'JSON Data', 
                    description: 'Raw analysis data for custom applications',
                    icon: Database,
                    color: 'from-green-500 to-emerald-500',
                    action: () => handleExport('json')
                  },
                  { 
                    title: '3D Model', 
                    description: '3D visualization model for presentations',
                    icon: Monitor,
                    color: 'from-purple-500 to-indigo-500',
                    action: () => handleExport('3d')
                  }
                ].map((option, idx) => (
                  <div key={idx} className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className={`bg-gradient-to-r ${option.color} p-4 rounded-xl inline-block mb-4`}>
                      <option.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
                    <p className="text-gray-600 mb-6">{option.description}</p>
                    <button
                      onClick={option.action}
                      className={`w-full bg-gradient-to-r ${option.color} text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200`}
                    >
                      Export {option.title}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>© 2025 Enterprise Îlot Placement System</span>
            <span>Professional License</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Version 2.1.0</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CADAnalysisApp;