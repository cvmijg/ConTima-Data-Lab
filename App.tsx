import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisReport from './components/AnalysisReport';
import ChatInterface from './components/ChatInterface';
import { analyzeFiles } from './services/geminiService';
import { readFileAsText } from './utils/fileUtils';
import { AnalysisResult, AppState, FileData } from './types';
import { Loader2, BrainCircuit, AlertCircle } from 'lucide-react';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileDataList, setFileDataList] = useState<FileData[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    // Append new files to existing ones, avoiding duplicates by name
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const filteredNew = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filteredNew];
    });
    setErrorMsg(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      // 1. Read files
      const filePromises = files.map(readFileAsText);
      const dataList: FileData[] = await Promise.all(filePromises);
      setFileDataList(dataList);

      // 2. Send to Gemini
      const result = await analyzeFiles(dataList);
      
      setAnalysisData(result);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    }
  };

  const resetAnalysis = () => {
    setAppState(AppState.IDLE);
    setAnalysisData(null);
    setFiles([]);
    setFileDataList([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={resetAnalysis}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
              ConTima
            </h1>
          </div>
          {appState === AppState.COMPLETE && (
            <button 
              onClick={resetAnalysis}
              className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              Start New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Intro Section (only when Idle) */}
        {appState === AppState.IDLE && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Content Performance & Revenue Analytics
            </h2>
            <p className="text-lg text-slate-600">
              Upload your YouTube Analytics CSV files. ConTima will auto-classify, merge, and generate actionable business insights for you.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {appState === AppState.IDLE && (
          <div className="space-y-8">
            <FileUpload 
              files={files} 
              onFilesSelected={handleFilesSelected} 
              onRemoveFile={handleRemoveFile} 
            />
            
            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={files.length === 0}
                className={`
                  px-8 py-3 rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:-translate-y-0.5
                  ${files.length === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'}
                `}
              >
                Analyze Data
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-xl border border-blue-100">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">Processing Your Data...</h3>
              <p className="text-slate-500">Classifying files • Merging datasets • Generating insights</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center py-12 max-w-lg mx-auto text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Analysis Failed</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button 
              onClick={() => setAppState(AppState.IDLE)}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results State */}
        {appState === AppState.COMPLETE && analysisData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <AnalysisReport data={analysisData} />
            <ChatInterface files={fileDataList} analysisData={analysisData} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;