import React, { useState, useRef } from 'react';
import { Camera, Upload, History, Scan, CheckCircle2, AlertCircle, X, Loader2, Trash2, Shield, Grid, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { recognizeNumberPlate } from './services/geminiService';
import { HistoryItem } from './types';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setError(null);
        // Automatically trigger process
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        setImage(base64);
        stopCamera();
        // Automatically trigger process
        processImage(base64);
      }
    }
  };

  const processImage = async (imgToProcess?: string) => {
    const targetImage = imgToProcess || image;
    if (!targetImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await recognizeNumberPlate(targetImage, 'image/jpeg');
      const newHistoryItem: HistoryItem = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        imageUrl: targetImage
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (err) {
      setError("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="h-20 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] leading-tight">Platr</h1>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">PRO VISION</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] rounded-full border border-[#DCFCE7]">
            <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#166534]">System Ready</span>
          </div>
          <button 
            onClick={() => { clearImage(); setIsCameraActive(false); }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Scan New Vehicle
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-[#E2E8F0] flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <History className="w-5 h-5" />
                <h2 className="font-bold">History</h2>
              </div>
              <button 
                onClick={clearHistory}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Clear
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2E8F0] text-center">
                  <p className="text-xs text-[#64748B] font-medium">No recent scans</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id} 
                    className="p-4 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#2563EB] transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#F1F5F9] rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt="Plate" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">
                          {item.plates.length} Plate{item.plates.length !== 1 ? 's' : ''} Detected
                        </p>
                        <p className="text-[10px] text-[#64748B] font-medium">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${item.plates.some(p => p.confidence === 'high') ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      <span>{item.plates[0]?.plateNumber || 'N/A'}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Session Stats Card */}
          <div className="p-6">
            <div className="bg-[#0F172A] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Scan className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Session Scans</p>
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-5xl font-bold tracking-tighter">{history.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Total</p>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(history.length * 10, 100)}%` }}
                    className="h-full bg-blue-500" 
                  />
                </div>
                <p className="text-[10px] italic opacity-40">Tracking active session throughput</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-1">Analysis Workspace</h2>
                <p className="text-[#64748B] font-medium">Live multi-stage detection pipeline active.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-[#64748B] hover:bg-white hover:text-[#2563EB] rounded-xl transition-all border border-transparent hover:border-[#E2E8F0]">
                  <Grid className="w-5 h-5" />
                </button>
                <button className="p-2.5 text-[#64748B] hover:bg-white hover:text-[#2563EB] rounded-xl transition-all border border-transparent hover:border-[#E2E8F0]">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col relative">
              <AnimatePresence mode="wait">
                {!image && !isCameraActive ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 bg-[#F1F5F9] rounded-3xl flex items-center justify-center mb-8">
                      <Scan className="w-10 h-10 text-[#2563EB]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F172A] mb-3">Awaiting Visual Input</h3>
                    <p className="text-[#64748B] max-w-md mb-10 leading-relaxed">
                      Load an image or provide a stream to initialize the high-precision detection sequence.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3.5 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl font-bold hover:bg-[#F8FAFC] transition-all shadow-sm"
                      >
                        Browse Repository
                      </button>
                      <button 
                        onClick={startCamera}
                        className="px-8 py-3.5 bg-[#2563EB] text-white rounded-2xl font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-500/20"
                      >
                        Activate Sensor
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </motion.div>
                ) : isCameraActive ? (
                  <motion.div 
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 relative"
                  >
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-80 h-32 border-2 border-white/50 rounded-2xl relative">
                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 active:scale-95 transition-transform"
                      >
                        <div className="w-14 h-14 bg-[#2563EB] rounded-full" />
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 relative bg-[#F8FAFC] flex items-center justify-center p-4 min-h-[400px]">
                      <div className="relative inline-block shadow-2xl rounded-2xl overflow-hidden">
                        <img 
                          src={image!} 
                          alt="Preview" 
                          className="block max-h-[75vh] w-auto object-contain"
                        />
                        
                        {/* Plate Highlight Boxes */}
                        {history.length > 0 && history[0].imageUrl === image && history[0].plates.map((plate, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute border-2 md:border-4 border-blue-500 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.6)] pointer-events-none z-10"
                            style={{
                              top: `${plate.plateBoundingBox.ymin / 10}%`,
                              left: `${plate.plateBoundingBox.xmin / 10}%`,
                              width: `${(plate.plateBoundingBox.xmax - plate.plateBoundingBox.xmin) / 10}%`,
                              height: `${(plate.plateBoundingBox.ymax - plate.plateBoundingBox.ymin) / 10}%`,
                            }}
                          >
                            <div className="absolute -top-7 left-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                              {plate.plateNumber}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={clearImage}
                        className="absolute top-8 right-8 p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white text-[#0F172A] shadow-lg transition-all z-20"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-8 bg-white border-t border-[#E2E8F0]">
                      {history.length > 0 && history[0].imageUrl === image ? (
                        <div className="space-y-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0F172A]">Scan Complete</p>
                                <p className="text-xs text-[#64748B]">{history[0].plates.length} license plate(s) identified</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {history[0].plates.map((plate, idx) => (
                              <div key={idx} className="p-6 bg-[#F8FAFC] rounded-[2rem] border border-[#E2E8F0] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                  <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                    plate.confidence === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {plate.confidence} Confidence
                                  </div>
                                </div>
                                
                                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                  Plate #{idx + 1} Details
                                </h4>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {[
                                    { label: 'Plate Number', value: plate.plateNumber, highlight: true },
                                    { label: 'Owner Name', value: plate.ownerName },
                                    { label: 'Vehicle Model', value: plate.vehicleModel },
                                    { label: 'Vehicle Type', value: plate.vehicleType },
                                    { label: 'Reg. Date', value: plate.registrationDate },
                                    { label: 'Region', value: plate.region },
                                  ].map((stat, i) => (
                                    <div key={i}>
                                      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">{stat.label}</p>
                                      <p className={`text-sm font-bold ${stat.highlight ? 'text-[#2563EB] text-lg' : 'text-[#0F172A]'}`}>
                                        {stat.value || 'N/A'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                              {isProcessing ? <Loader2 className="text-[#2563EB] w-6 h-6 animate-spin" /> : <Scan className="text-[#2563EB] w-6 h-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0F172A]">{isProcessing ? 'Analyzing Image...' : 'Ready for Analysis'}</p>
                              <p className="text-xs text-[#64748B]">{isProcessing ? 'Running multi-stage OCR pipeline' : 'High-precision OCR engine standby'}</p>
                            </div>
                          </div>
                          {isProcessing && (
                            <div className="flex items-center gap-2 text-[#2563EB]">
                              <span className="text-xs font-bold animate-pulse">Processing...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 shadow-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
