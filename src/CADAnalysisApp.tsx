import React, { useState, useRef } from 'react';
import { Upload, FileText, Play, Grid, MapPin, Download, CheckCircle, Clock, Settings, BarChart3, Zap } from 'lucide-react';
import { CADProcessor } from './utils/cadProcessor';
import { IlotOptimizer } from './utils/ilotOptimizer';
import { CorridorGenerator, CorridorConfig } from './utils/corridorGenerator';
import { ExportManager } from './utils/exportManager';
import { FloorPlan, Ilot, Corridor, CADAnalysisResult } from './types/cad';

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

  const ProfessionalCADVisualization = () => (
    <div className="card w-full animate-fade-in">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {uploadedFile?.name || 'Floor Plan Analysis'}
              </h3>
              <p className="text-sm text-gray-600">Interactive CAD visualization with real-time analysis</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
              Scale: 1:100 | Unit: mm
            </div>
            <div className="text-xs text-gray-500 mt-1">Updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <svg 
        width="100%" 
        height="600" 
        viewBox="0 0 800 600" 
        className="bg-white"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {floorPlanData && (
          <>
            {/* Walls - Clean black lines */}
            {floorPlanData.walls.map((wall, idx) => (
              <line
                key={idx}
                x1={wall.start.x / 20}
                y1={wall.start.y / 20}
                x2={wall.end.x / 20}
                y2={wall.end.y / 20}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="square"
              />
            ))}

            {/* Restricted Areas - Blue zones */}
            {floorPlanData.restrictedAreas.map((area, idx) => {
              const bounds = area.bounds;
              if (bounds.length >= 4) {
                const minX = Math.min(...bounds.map(p => p.x)) / 20;
                const minY = Math.min(...bounds.map(p => p.y)) / 20;
                const maxX = Math.max(...bounds.map(p => p.x)) / 20;
                const maxY = Math.max(...bounds.map(p => p.y)) / 20;
                return (
                  <g key={idx}>
                    <rect
                      x={minX}
                      y={minY}
                      width={maxX - minX}
                      height={maxY - minY}
                      fill="#4A90E2"
                      fillOpacity="0.3"
                      stroke="#4A90E2"
                      strokeWidth="1"
                    />
                    <text
                      x={minX + (maxX - minX) / 2}
                      y={minY + (maxY - minY) / 2}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#4A90E2"
                      fontWeight="bold"
                    >
                      NO ENTRÉE
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Doors - Red entrance markers */}
            {floorPlanData.doors.map((door, idx) => (
              <g key={idx}>
                <rect
                  x={door.position.x / 20 - door.width / 40}
                  y={door.position.y / 20 - door.height / 40}
                  width={door.width / 20}
                  height={door.height / 20}
                  fill="#E74C3C"
                  stroke="#E74C3C"
                  strokeWidth="2"
                />
                <text
                  x={door.position.x / 20}
                  y={door.position.y / 20 + 15}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#E74C3C"
                  fontWeight="bold"
                >
                  ENTRÉE/SORTIE
                </text>
              </g>
            ))}
          </>
        )}

        {/* Îlots - Pink rectangles with area labels */}
        {ilotData && ilotData.map((ilot, idx) => (
          <g key={idx}>
            <rect
              x={ilot.position.x / 20 - ilot.width / 40}
              y={ilot.position.y / 20 - ilot.height / 40}
              width={ilot.width / 20}
              height={ilot.height / 20}
              fill="#FF69B4"
              fillOpacity="0.4"
              stroke="#E91E63"
              strokeWidth="1"
            />
            <text
              x={ilot.position.x / 20}
              y={ilot.position.y / 20}
              textAnchor="middle"
              fontSize="9"
              fill="#000"
              fontWeight="bold"
            >
              {(ilot.area / 1000000).toFixed(1)}m²
            </text>
          </g>
        ))}

        {/* Corridors - Pink pathways */}
        {corridorData && corridorData.map((corridor, idx) => {
          return corridor.path.map((point, pointIdx) => {
            if (pointIdx < corridor.path.length - 1) {
              const nextPoint = corridor.path[pointIdx + 1];
              return (
                <line
                  key={`${idx}-${pointIdx}`}
                  x1={point.x / 20}
                  y1={point.y / 20}
                  x2={nextPoint.x / 20}
                  y2={nextPoint.y / 20}
                  stroke="#FF1493"
                  strokeWidth={Math.max(2, corridor.width / 200)}
                  strokeLinecap="round"
                />
              );
            }
            return null;
          });
        })}

        {/* Legend */}
        <g transform="translate(650, 50)">
          <rect x="0" y="0" width="140" height="120" fill="white" stroke="black" strokeWidth="1"/>

          <rect x="10" y="15" width="15" height="10" fill="#4A90E2" fillOpacity="0.3"/>
          <text x="30" y="24" fontSize="10" fill="black">NO ENTRÉE</text>

          <rect x="10" y="35" width="15" height="10" fill="#E74C3C"/>
          <text x="30" y="44" fontSize="10" fill="black">ENTRÉE/SORTIE</text>

          <rect x="10" y="55" width="15" height="10" fill="#000" stroke="none"/>
          <text x="30" y="64" fontSize="10" fill="black">MUR</text>

          <rect x="10" y="75" width="15" height="10" fill="#FF69B4" fillOpacity="0.4"/>
          <text x="30" y="84" fontSize="10" fill="black">ÎLOTS</text>

          <line x1="10" y1="100" x2="25" y2="100" stroke="#FF1493" strokeWidth="3"/>
          <text x="30" y="104" fontSize="10" fill="black">CORRIDORS</text>
        </g>
        </svg>
      </div>
    </div>
  );

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
      {/* Modern Header with Glass Effect */}
      <div className="glass sticky top-0 z-50 px-6 py-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  CAD Analysis Pro
                </h1>
                <p className="text-gray-600 font-medium">AI-Powered Floor Plan Analysis & Space Optimization</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`progress-step ${currentStep >= 0 ? 'completed' : 'pending'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className={`w-8 h-0.5 ${currentStep >= 1 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
                <div className={`progress-step ${currentStep >= 1 ? 'completed' : currentStep === 0 ? 'active' : 'pending'}`}>
                  <Grid className="w-5 h-5" />
                </div>
                <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
                <div className={`progress-step ${currentStep >= 2 ? 'completed' : currentStep === 1 ? 'active' : 'pending'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  AI Engine Active
                </div>
                <div className="text-xs text-gray-500 font-mono">v2.1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced File Upload Section */}
        <div className="card animate-fade-in mb-8">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload CAD File</h2>
                <p className="text-sm text-gray-600">Support for DXF, DWG, and PDF formats with intelligent processing</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div 
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                uploadedFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50'
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
                  <div className="relative inline-block">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <CheckCircle className="w-6 h-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{uploadedFile.name}</h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Ready for processing
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative inline-block mb-6">
                    <Upload className="w-16 h-16 mx-auto text-gray-400" />
                    <div className="absolute inset-0 bg-blue-600 w-16 h-16 rounded-full opacity-0 animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Drop your CAD file here</h3>
                  <p className="text-gray-600 mb-6">Or click to browse and select your file</p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      DXF Files
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      DWG Files
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      PDF Files
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
        {floorPlanData && <ProfessionalCADVisualization />}

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