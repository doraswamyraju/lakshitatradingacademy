
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, BarChart3, Settings2, Info } from 'lucide-react';
import { AlgorithmType, VisualizerState } from '../types';
import { getAlgorithmGenerator, SortStep } from '../services/algorithms';
import { analyzeAlgorithm } from '../services/geminiService';

const Visualizer: React.FC = () => {
  const [state, setState] = useState<VisualizerState>({
    array: [],
    comparingIndices: [],
    swappingIndices: [],
    sortedIndices: [],
    isSorting: false,
    isPaused: false,
    algorithm: 'bubble',
    speed: 50,
    arraySize: 30,
  });

  const [aiAnalysis, setAiAnalysis] = useState<{
    loading: boolean;
    data: null | { time: string; space: string; note: string; tips: string };
  }>({ loading: false, data: null });

  const generatorRef = useRef<Generator<SortStep> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    resetArray();
  }, [state.arraySize]);

  const resetArray = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newArray = Array.from({ length: state.arraySize }, () => Math.floor(Math.random() * 100) + 10);
    setState(prev => ({
      ...prev,
      array: newArray,
      comparingIndices: [],
      swappingIndices: [],
      sortedIndices: [],
      isSorting: false,
      isPaused: false,
    }));
    generatorRef.current = null;
  };

  const handleStart = () => {
    if (state.isSorting && !state.isPaused) return;

    if (!state.isSorting) {
      generatorRef.current = getAlgorithmGenerator(state.algorithm, state.array);
      setState(prev => ({ ...prev, isSorting: true, isPaused: false }));
      step();
    } else {
      setState(prev => ({ ...prev, isPaused: false }));
      step();
    }
  };

  const handlePause = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const step = () => {
    if (!generatorRef.current) return;

    const { value, done } = generatorRef.current.next();

    if (done) {
      setState(prev => ({
        ...prev,
        isSorting: false,
        comparingIndices: [],
        swappingIndices: [],
        sortedIndices: Array.from({ length: prev.array.length }, (_, i) => i),
      }));
      return;
    }

    if (value) {
      setState(prev => ({
        ...prev,
        array: value.array,
        comparingIndices: value.comparing,
        swappingIndices: value.swapping,
        sortedIndices: value.sorted,
      }));

      const delay = Math.max(10, 500 - (state.speed * 4.5));
      timeoutRef.current = setTimeout(step, delay);
    }
  };

  const handleAnalyze = async () => {
    setAiAnalysis({ loading: true, data: null });
    const result = await analyzeAlgorithm(state.algorithm, state.arraySize);
    setAiAnalysis({
      loading: false,
      data: {
        time: result.timeComplexity,
        space: result.spaceComplexity,
        note: result.explanation,
        tips: result.optimizationTips
      }
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-samp-surface p-4 rounded-xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="bg-samp-primary/20 p-2 rounded-lg text-samp-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Visualizer</h2>
            <p className="text-xs text-gray-400">Real-time execution engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={state.algorithm}
            onChange={(e) => {
                resetArray();
                setState(p => ({...p, algorithm: e.target.value as AlgorithmType}));
            }}
            disabled={state.isSorting && !state.isPaused}
            className="bg-samp-bg border border-white/10 text-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-samp-primary transition-colors"
          >
            <option value="bubble">Bubble Sort</option>
            <option value="selection">Selection Sort</option>
            <option value="insertion">Insertion Sort</option>
          </select>

          <button onClick={resetArray} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Reset"><RotateCcw size={20} /></button>
          
          {!state.isSorting || state.isPaused ? (
             <button onClick={handleStart} className="flex items-center gap-2 bg-samp-primary hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-samp-primary/25"><Play size={18} fill="currentColor" /> {state.isPaused ? 'Resume' : 'Start'}</button>
          ) : (
            <button onClick={handlePause} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-amber-500/25"><Pause size={18} fill="currentColor" /> Pause</button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
        <div className="flex-1 bg-samp-surface rounded-xl border border-white/5 p-6 relative flex items-end justify-center gap-[2px] overflow-hidden shadow-inner">
           {state.array.map((value, idx) => {
             let colorClass = 'bg-slate-600'; 
             if (state.comparingIndices.includes(idx)) colorClass = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
             if (state.swappingIndices.includes(idx)) colorClass = 'bg-samp-danger shadow-[0_0_15px_rgba(239,68,68,0.5)]';
             if (state.sortedIndices.includes(idx)) colorClass = 'bg-samp-success shadow-[0_0_10px_rgba(16,185,129,0.3)]';

             const height = `${(value / 120) * 100}%`;
             
             return (
               <div
                 key={idx}
                 style={{ height, width: `${100 / state.arraySize}%` }}
                 className={`rounded-t-sm transition-all duration-200 ${colorClass}`}
               ></div>
             );
           })}
           
           <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5">
             <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Settings2 size={12}/> Size</span>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={state.arraySize} 
                      onChange={(e) => setState(p => ({...p, arraySize: Number(e.target.value)}))}
                      disabled={state.isSorting}
                      className="w-24 accent-samp-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Zap size={12}/> Speed</span>
                    <input 
                      type="range" 
                      min="1" max="100" 
                      value={state.speed} 
                      onChange={(e) => setState(p => ({...p, speed: Number(e.target.value)}))}
                      className="w-24 accent-samp-accent h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
             </div>
           </div>
        </div>

        <div className="lg:w-80 flex flex-col gap-4">
            <div className="bg-samp-surface rounded-xl border border-white/5 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-samp-accent" /> Algorithm Stats
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">Current Algorithm</span>
                        <span className="text-white font-mono capitalize">{state.algorithm} Sort</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">Elements</span>
                        <span className="text-white font-mono">{state.arraySize}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Comparisons</span>
                        <span className="text-white font-mono">{state.isSorting ? 'Active' : 'Idle'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-samp-surface to-slate-900 rounded-xl border border-white/5 p-1 flex-1 flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-samp-primary animate-pulse"></span>
                         Gemini Analysis
                    </span>
                    <button 
                        onClick={handleAnalyze}
                        disabled={aiAnalysis.loading}
                        className="text-xs bg-white/5 hover:bg-white/10 text-samp-primary px-3 py-1 rounded-full transition-colors"
                    >
                        {aiAnalysis.loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto min-h-[150px]">
                    {aiAnalysis.loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <div className="w-6 h-6 border-2 border-samp-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Processing complexity...</span>
                        </div>
                    ) : aiAnalysis.data ? (
                        <div className="space-y-4 text-sm animate-in fade-in slide-in-from-bottom-2">
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-black/20 p-2 rounded">
                                     <p className="text-xs text-gray-500 mb-1">Time</p>
                                     <p className="text-samp-warning font-mono">{aiAnalysis.data.time}</p>
                                 </div>
                                 <div className="bg-black/20 p-2 rounded">
                                     <p className="text-xs text-gray-500 mb-1">Space</p>
                                     <p className="text-samp-accent font-mono">{aiAnalysis.data.space}</p>
                                 </div>
                             </div>
                             <div>
                                 <p className="text-xs text-gray-500 mb-1">How it works</p>
                                 <p className="text-gray-300 leading-relaxed">{aiAnalysis.data.note}</p>
                             </div>
                             <div className="bg-samp-primary/10 border border-samp-primary/20 p-3 rounded-lg">
                                 <p className="text-xs text-samp-primary font-bold mb-1 uppercase tracking-wider">Pro Tip</p>
                                 <p className="text-gray-300 text-xs">{aiAnalysis.data.tips}</p>
                             </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-xs mt-10">
                            Click "Analyze" to get real-time AI insights about this algorithm state.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
