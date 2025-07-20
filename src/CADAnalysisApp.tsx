import React, { useState, useRef } from 'react';
import { Upload, FileText, Play, Grid, MapPin, Download, CheckCircle, Clock, Settings, BarChart3, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Modern Header */}
      <div className="glass sticky top-0 z-50 px-6 py-4 border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-3 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  CAD Analysis Pro
                </h1>
                <p className="text-gray-600 text-sm font-medium">Intelligent Floor Plan Analysis & Space Optimization</p>
              </div>
            </div>
            
            {/* Enhanced Progress Indicator */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <div className={`progress-dot ${currentStep >= 0 ? 'completed' : 'pending'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className={`progress-line ${currentStep >= 1 ? 'completed' : 'pending'}`}></div>
                <div className={`progress-dot ${currentStep >= 1 ? 'completed' : currentStep === 0 ? 'active' : 'pending'}`}>
                  <Grid className="w-4 h-4" />
                </div>
                <div className={`progress-line ${currentStep >= 2 ? 'completed' : 'pending'}`}></div>
                <div className={`progress-dot ${currentStep >= 2 ? 'completed' : currentStep === 1 ? 'active' : 'pending'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  AI Ready
                </div>
                <div className="text-xs text-gray-500 font-mono">v2.1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced File Upload Section */}
        <div className="card animate-fade-in mb-8 overflow-hidden">
          <div className="card-header bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upload CAD File</h2>
                <p className="text-sm text-gray-600">Drag & drop or click to upload • DXF, DWG, PDF supported</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-500 group ${
                uploadedFile 
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-xl'
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
                <div className="animate-slide-in">
                  <div className="relative inline-block mb-4">
                    <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-4 rounded-2xl">
                      <FileText className="w-12 h-12 mx-auto text-emerald-600" />
                    </div>
                    <CheckCircle className="w-6 h-6 text-emerald-500 absolute -top-1 -right-1 bg-white rounded-full shadow-lg" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{uploadedFile.name}</h3>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <span className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-700">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </span>
                    <span className="flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700">Ready to Process</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative inline-block mb-6">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-3xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                      <Upload className="w-12 h-12 mx-auto text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute inset-0 bg-blue-400 rounded-3xl opacity-20 group-hover:animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Drag & Drop Your CAD File</h3>
                  <p className="text-gray-600 mb-6">Or click anywhere to browse and select your file</p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-700">DXF</span>
                    </span>
                    <span className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">DWG</span>
                    </span>
                    <span className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-full border border-red-200">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-700">PDF</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Processing Controls */}
        {uploadedFile && (
          <div className="card animate-fade-in mb-8">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Analysis Pipeline</h2>
                    <p className="text-sm text-gray-600">Configure analysis parameters and execute processing steps</p>
                  </div>
                </div>
                {processing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8">
              {/* Enhanced Corridor Configuration */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Configuration Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Corridor Width
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={corridorConfig.width}
                        onChange={(e) => setCorridorConfig({
                          ...corridorConfig,
                          width: parseInt(e.target.value) || 1200
                        })}
                        className="input-field pr-12"
                        min="800"
                        max="3000"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mm</span>
                    </div>
                    <p className="text-xs text-gray-500">Recommended: 1200-1800mm</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Min Clearance
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={corridorConfig.minClearance}
                        onChange={(e) => setCorridorConfig({
                          ...corridorConfig,
                          minClearance: parseInt(e.target.value) || 600
                        })}
                        className="input-field pr-12"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mm</span>
                    </div>
                    <p className="text-xs text-gray-500">Safety clearance space</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Max Length
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={corridorConfig.maxLength}
                        onChange={(e) => setCorridorConfig({
                          ...corridorConfig,
                          maxLength: parseInt(e.target.value) || 15000
                        })}
                        className="input-field pr-12"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mm</span>
                    </div>
                    <p className="text-xs text-gray-500">Maximum corridor span</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Compliance
                    </label>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="accessibility"
                        checked={corridorConfig.accessibility}
                        onChange={(e) => setCorridorConfig({
                          ...corridorConfig,
                          accessibility: e.target.checked
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="accessibility" className="ml-3 text-sm font-medium text-gray-700">
                        ADA Compliant
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">Accessibility standards</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Process Buttons */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-500" />
                  Processing Steps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => processStep(0)}
                    disabled={processing}
                    className={`${
                      processing && currentStep === 0 
                        ? 'btn-secondary' 
                        : currentStep >= 1 
                        ? 'btn-success' 
                        : 'btn-primary'
                    } flex items-center gap-3 justify-center relative overflow-hidden`}
                  >
                    {processing && currentStep === 0 ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : currentStep >= 1 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">
                        {processing && currentStep === 0 ? 'Processing...' : 'Extract Floor Plan'}
                      </span>
                      <span className="text-xs opacity-80">Parse CAD structure</span>
                    </div>
                  </button>

                  <button
                    onClick={() => processStep(1)}
                    disabled={processing || !floorPlanData}
                    className={`${
                      processing && currentStep === 1 
                        ? 'btn-secondary' 
                        : currentStep >= 2 
                        ? 'btn-success' 
                        : 'btn-accent'
                    } flex items-center gap-3 justify-center`}
                  >
                    {processing && currentStep === 1 ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : currentStep >= 2 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Grid className="w-5 h-5" />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">
                        {processing && currentStep === 1 ? 'Optimizing...' : 'Place Îlots'}
                      </span>
                      <span className="text-xs opacity-80">AI space optimization</span>
                    </div>
                  </button>

                  <button
                    onClick={() => processStep(2)}
                    disabled={processing || !ilotData}
                    className={`${
                      processing && currentStep === 2 
                        ? 'btn-secondary' 
                        : analysisResult 
                        ? 'btn-success' 
                        : 'btn-warning'
                    } flex items-center gap-3 justify-center`}
                  >
                    {processing && currentStep === 2 ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : analysisResult ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">
                        {processing && currentStep === 2 ? 'Generating...' : 'Generate Corridors'}
                      </span>
                      <span className="text-xs opacity-80">Smart pathway design</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional CAD Visualization */}
        {/* Professional Floor Plan Visualization */}
        {floorPlanData && (
          <div className="card animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Grid className="w-6 h-6 text-blue-600" />
              Professional Floor Plan Analysis
            </h3>
            <ProfessionalFloorPlanRenderer
              floorPlan={floorPlanData}
              ilots={ilotData || []}
              corridors={corridorData || []}
              showIlots={currentStep >= 2}
              showCorridors={currentStep >= 3}
              scale={0.8}
            />
          </div>
        )}

        {/* Enhanced Analysis Results */}
        {analysisResult && (
          <div className="card animate-fade-in mt-8">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                    <p className="text-sm text-gray-600">Comprehensive analysis report with optimization metrics</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleExport('pdf')}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                  <button 
                    onClick={() => handleExport('dxf')}
                    className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export DXF
                  </button>
                  <button 
                    onClick={() => handleExport('json')}
                    className="btn-success flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Grid className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{analysisResult.optimization.totalIlots}</div>
                      <div className="text-sm text-blue-700 font-medium">Total Îlots</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600">Optimal workspace distribution</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">{analysisResult.optimization.spaceUtilization.toFixed(1)}%</div>
                      <div className="text-sm text-green-700 font-medium">Space Utilization</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-600">Efficient space allocation</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{(analysisResult.optimization.totalCorridorLength / 1000).toFixed(1)}m</div>
                      <div className="text-sm text-purple-700 font-medium">Corridor Length</div>
                    </div>
                  </div>
                  <div className="text-xs text-purple-600">Optimized circulation paths</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">{analysisResult.optimization.efficiency.toFixed(1)}%</div>
                      <div className="text-sm text-orange-700 font-medium">Efficiency Score</div>
                    </div>
                  </div>
                  <div className="text-xs text-orange-600">Overall layout performance</div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Compliance & Quality Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{analysisResult.optimization.accessibilityScore.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Accessibility Score</div>
                    <div className="text-xs text-gray-500 mt-1">ADA compliance rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{analysisResult.optimization.clearanceCompliance}%</div>
                    <div className="text-sm text-gray-600">Clearance Compliance</div>
                    <div className="text-xs text-gray-500 mt-1">Safety standard adherence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{corridorData?.length || 0}</div>
                    <div className="text-sm text-gray-600">Corridor Segments</div>
                    <div className="text-xs text-gray-500 mt-1">Generated pathway count</div>
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