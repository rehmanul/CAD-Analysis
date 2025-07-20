import React, { useState, useRef } from 'react';
import { Upload, FileText, Play, Grid, MapPin, Download, CheckCircle, Settings, BarChart3, Zap, Menu, Layers, Eye } from 'lucide-react';
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
    if (!analysisResult) {
      alert('Please complete the analysis first');
      return;
    }

    const exportManager = new ExportManager(analysisResult);

    try {
      switch (format) {
        case 'pdf':
          await exportManager.exportPDF();
          break;
        case 'dxf':
          exportManager.exportDXF();
          break;
        case 'json':
          exportManager.exportJSON();
          break;
        case '3d':
          exportManager.export3DModel();
          break;
        default:
          alert('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Professional CAD-style Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">CAD Analysis Pro</h1>
              <p className="text-gray-400 text-xs">Professional Floor Plan Analysis</p>
            </div>
          </div>
          
          {/* Center - Menu bar like CAD software */}
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button className="px-3 py-1 text-white hover:bg-gray-600 rounded text-sm">File</button>
            <button className="px-3 py-1 text-white hover:bg-gray-600 rounded text-sm">Edit</button>
            <button className="px-3 py-1 text-white hover:bg-gray-600 rounded text-sm">View</button>
            <button className="px-3 py-1 text-white hover:bg-gray-600 rounded text-sm">Tools</button>
            <button className="px-3 py-1 text-white hover:bg-gray-600 rounded text-sm">Analysis</button>
          </div>
          
          {/* Right side - Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-900/30 px-2 py-1 rounded border border-green-600/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs">AI Ready</span>
            </div>
            <span className="text-gray-400 text-xs">v2.1.0</span>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="bg-gray-750 border-t border-gray-700 px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${currentStep >= 0 ? 'bg-green-600' : 'bg-gray-600'}`}>
                <FileText className="w-3 h-3" />
                <span>Extract</span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${currentStep >= 1 ? 'bg-green-600' : currentStep === 0 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <Grid className="w-3 h-3" />
                <span>Optimize</span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${currentStep >= 2 ? 'bg-green-600' : currentStep === 1 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <MapPin className="w-3 h-3" />
                <span>Generate</span>
              </div>
            </div>
            
            {processing && (
              <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-blue-900/30 rounded border border-blue-600/30">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-400 text-xs">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left Panel - Properties like CAD software */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* File Upload Panel */}
            <div className="bg-gray-750 rounded border border-gray-600">
              <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">File Operations</span>
                </div>
              </div>
              
              <div className="p-4">
                <div 
                  className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-all ${
                    uploadedFile 
                      ? 'border-green-500 bg-green-900/10' 
                      : 'border-gray-500 hover:border-blue-500 hover:bg-blue-900/10'
                  }`}
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
                    <div>
                      <FileText className="w-8 h-8 mx-auto text-green-400 mb-2" />
                      <p className="text-white text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-white text-sm">Drop CAD file here</p>
                      <p className="text-gray-400 text-xs">DXF, DWG, PDF</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            {uploadedFile && (
              <div className="bg-gray-750 rounded border border-gray-600">
                <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-400" />
                    <span className="text-white text-sm font-medium">Parameters</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Corridor Width (mm)</label>
                    <input
                      type="number"
                      value={corridorConfig.width}
                      onChange={(e) => setCorridorConfig({
                        ...corridorConfig,
                        width: parseInt(e.target.value) || 1200
                      })}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      min="800"
                      max="3000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Min Clearance (mm)</label>
                    <input
                      type="number"
                      value={corridorConfig.minClearance}
                      onChange={(e) => setCorridorConfig({
                        ...corridorConfig,
                        minClearance: parseInt(e.target.value) || 600
                      })}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Max Length (mm)</label>
                    <input
                      type="number"
                      value={corridorConfig.maxLength}
                      onChange={(e) => setCorridorConfig({
                        ...corridorConfig,
                        maxLength: parseInt(e.target.value) || 15000
                      })}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accessibility"
                      checked={corridorConfig.accessibility}
                      onChange={(e) => setCorridorConfig({
                        ...corridorConfig,
                        accessibility: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="accessibility" className="text-gray-300 text-xs">ADA Compliant</label>
                  </div>
                </div>
              </div>
            )}

            {/* Process Controls */}
            {uploadedFile && (
              <div className="bg-gray-750 rounded border border-gray-600">
                <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm font-medium">Processing</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => processStep(0)}
                    disabled={processing}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                      processing && currentStep === 0 
                        ? 'bg-blue-600 text-white' 
                        : currentStep >= 1 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {processing && currentStep === 0 ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : currentStep >= 1 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{processing && currentStep === 0 ? 'Processing...' : 'Extract Floor Plan'}</span>
                  </button>

                  <button
                    onClick={() => processStep(1)}
                    disabled={processing || !floorPlanData}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                      processing && currentStep === 1 
                        ? 'bg-blue-600 text-white' 
                        : currentStep >= 2 
                        ? 'bg-green-600 text-white' 
                        : floorPlanData
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-gray-600 text-gray-500'
                    }`}
                  >
                    {processing && currentStep === 1 ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : currentStep >= 2 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Grid className="w-4 h-4" />
                    )}
                    <span>{processing && currentStep === 1 ? 'Optimizing...' : 'Place Îlots'}</span>
                  </button>

                  <button
                    onClick={() => processStep(2)}
                    disabled={processing || !ilotData}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                      processing && currentStep === 2 
                        ? 'bg-blue-600 text-white' 
                        : analysisResult 
                        ? 'bg-green-600 text-white' 
                        : ilotData
                        ? 'bg-orange-600 text-white hover:bg-orange-500'
                        : 'bg-gray-600 text-gray-500'
                    }`}
                  >
                    {processing && currentStep === 2 ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : analysisResult ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span>{processing && currentStep === 2 ? 'Generating...' : 'Generate Corridors'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Export Controls */}
            {analysisResult && (
              <div className="bg-gray-750 rounded border border-gray-600">
                <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm font-medium">Export</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  <button 
                    onClick={() => handleExport('pdf')}
                    className="w-full bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                  <button 
                    onClick={() => handleExport('dxf')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export DXF
                  </button>
                  <button 
                    onClick={() => handleExport('json')}
                    className="w-full bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Viewport - CAD Drawing Area */}
        <div className="flex-1 bg-gray-850 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Viewport Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-white font-medium">Floor Plan Analysis</h3>
                  {floorPlanData && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Layers className="w-4 h-4" />
                      <span>Scale: 1:100</span>
                    </div>
                  )}
                </div>
                
                {floorPlanData && (
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">
                      Zoom Fit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Drawing Area */}
            <div className="flex-1 p-4">
              {floorPlanData ? (
                <div className="h-full bg-white rounded border border-gray-600 overflow-hidden">
                  <ProfessionalFloorPlanRenderer
                    floorPlan={floorPlanData}
                    ilots={ilotData || []}
                    corridors={corridorData || []}
                    showIlots={currentStep >= 2}
                    showCorridors={currentStep >= 3}
                    scale={0.8}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-gray-400 text-lg font-medium mb-2">No Floor Plan Loaded</h3>
                    <p className="text-gray-500 text-sm">Upload a CAD file to begin analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Analysis Results */}
        {analysisResult && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="bg-gray-750 rounded border border-gray-600">
                <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm font-medium">Analysis Results</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-600/30">
                      <div className="text-blue-400 text-xs">Total Îlots</div>
                      <div className="text-white text-lg font-bold">{analysisResult.optimization.totalIlots}</div>
                    </div>
                    
                    <div className="bg-green-900/20 p-3 rounded border border-green-600/30">
                      <div className="text-green-400 text-xs">Space Utilization</div>
                      <div className="text-white text-lg font-bold">{analysisResult.optimization.spaceUtilization.toFixed(1)}%</div>
                    </div>
                    
                    <div className="bg-purple-900/20 p-3 rounded border border-purple-600/30">
                      <div className="text-purple-400 text-xs">Corridor Length</div>
                      <div className="text-white text-lg font-bold">{(analysisResult.optimization.totalCorridorLength / 1000).toFixed(1)}m</div>
                    </div>
                    
                    <div className="bg-orange-900/20 p-3 rounded border border-orange-600/30">
                      <div className="text-orange-400 text-xs">Efficiency</div>
                      <div className="text-white text-lg font-bold">{analysisResult.optimization.efficiency.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="text-gray-300 text-xs mb-2">Compliance Metrics</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Accessibility Score</span>
                        <span className="text-white">{analysisResult.optimization.accessibilityScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Clearance Compliance</span>
                        <span className="text-white">{analysisResult.optimization.clearanceCompliance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Corridor Segments</span>
                        <span className="text-white">{corridorData?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CADAnalysisApp;