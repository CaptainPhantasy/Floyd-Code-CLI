import React, { useState, useEffect } from 'react';
import { Terminal, Code2, CheckCircle2, Loader2, Copy, Palette, LayoutTemplate, Monitor, BoxSelect, Zap, SplitSquareHorizontal, Scale, MessageSquare, Send } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Preview from './components/Preview';
import { analyzeTerminalImage, refineLayout } from './services/geminiService';
import { AnalysisState } from './types';

const THEMES = [
  { id: 'auto', label: 'Auto Detect', color: 'bg-zinc-600' },
  { id: 'floyd-neon', label: 'Floyd Neon', color: 'bg-cyan-400' },
  { id: 'dracula', label: 'Dracula', color: 'bg-purple-400' },
  { id: 'solarized', label: 'Solarized', color: 'bg-yellow-400' },
  { id: 'monokai', label: 'Monokai', color: 'bg-orange-400' },
  { id: 'gruvbox', label: 'Gruvbox', color: 'bg-green-400' },
  { id: 'synthwave', label: 'Synthwave', color: 'bg-pink-500' },
  { id: 'nord', label: 'Nord', color: 'bg-blue-300' },
];

const ANIMATIONS = [
  { id: 'none', label: 'Static' },
  { id: 'breathe', label: 'Breathe' },
  { id: 'rolling', label: 'Rolling' },
  { id: 'gradient', label: 'Gradient' },
];

const MONITOR_PRESETS = [
  { id: 'std', label: 'Standard (160x45)', cols: 160, rows: 45 },
  { id: 'fhd', label: '1080p FHD (240x67)', cols: 240, rows: 67 },
  { id: 'dual', label: 'Dual 1080p (480x67)', cols: 480, rows: 67 },
  { id: 'ultrawide', label: 'Ultrawide (430x90)', cols: 430, rows: 90 },
  { id: '4k', label: '4K UHD (480x135)', cols: 480, rows: 135 },
];

const LOADING_MESSAGES = [
  "Scanning terminal boundaries...",
  "Identifying UI components...",
  "Extracting color palette...",
  "Calculating flexbox relationships...",
  "Generating JSON specification...",
  "Almost there..."
];

function App() {
  const [theme, setTheme] = useState('auto');
  const [secondaryTheme, setSecondaryTheme] = useState<string>('');
  const [dualMode, setDualMode] = useState<'blend' | 'split'>('blend');
  const [animation, setAnimation] = useState<'none'|'breathe'|'rolling'|'gradient'>('none');
  
  const [monitor, setMonitor] = useState(MONITOR_PRESETS[0]);
  const [addFloatingFrame, setAddFloatingFrame] = useState(false);
  const [useFlex, setUseFlex] = useState(false); 
  
  // New States
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [refinePrompt, setRefinePrompt] = useState<string>("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    error: null,
    imageUrl: null,
  });

  // Cycle loading messages
  useEffect(() => {
    if (state.status === 'analyzing' || state.status === 'refining') {
      let i = 0;
      setLoadingMsg(LOADING_MESSAGES[0]);
      const interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMsg(LOADING_MESSAGES[i]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state.status]);

  const handleFileSelect = async (base64: string) => {
    setState({ status: 'analyzing', data: null, error: null, imageUrl: base64 });

    try {
      const result = await analyzeTerminalImage(
        base64, 
        theme, 
        monitor,
        addFloatingFrame,
        {
            secondaryTheme: secondaryTheme || undefined,
            dualMode: secondaryTheme ? dualMode : undefined,
            animation,
            useFlex,
            asciiArt: asciiArt || undefined // Pass ASCII input if present
        }
      );
      setState(prev => ({ ...prev, status: 'success', data: result }));
    } catch (err: any) {
      // Handle cancellations gracefully
      if (err.name === 'AbortError' || err.message === 'Canceled') {
        console.log('Analysis request canceled');
        setState(prev => ({ ...prev, status: 'idle', error: null }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: err.message || "Failed to analyze layout. Please try again." 
      }));
    }
  };

  const handleRefine = async () => {
      if (!state.data || !refinePrompt.trim()) return;
      
      const oldData = state.data;
      setState(prev => ({ ...prev, status: 'refining', error: null }));

      try {
          const newData = await refineLayout(oldData, refinePrompt, state.imageUrl);
          // Preserve local UI state that isn't part of the JSON spec strictly if needed,
          // but mainly we trust the returned JSON.
          setState(prev => ({ ...prev, status: 'success', data: newData }));
          setRefinePrompt("");
      } catch (err: any) {
          // Handle cancellations gracefully
          if (err.name === 'AbortError' || err.message === 'Canceled') {
             console.log('Refinement request canceled');
             // Revert to success state with existing data
             setState(prev => ({ ...prev, status: 'success', error: null }));
             return;
          }

          setState(prev => ({ 
             ...prev, 
             status: 'success', // Revert to success to show old data 
             error: err.message || "Failed to refine layout." 
          }));
      }
  };

  const copyToClipboard = () => {
    if (state.data) {
      navigator.clipboard.writeText(JSON.stringify(state.data, null, 2));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-cyan-900 selection:text-cyan-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Terminal size={20} className="text-cyan-400" />
            </div>
            <h1 className="font-bold text-lg text-zinc-100 tracking-tight">
              TUI<span className="text-zinc-500">2</span>JSON
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Gemini 3 Pro Vision
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        
        {/* Intro */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Turn Screenshots into <span className="text-cyan-400">Specs</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Upload a terminal UI image. Gemini Vision will reverse-engineer the layout into a hierarchical, structured JSON specification.
          </p>
        </section>

        {/* Controls Section */}
        <section className="max-w-xl mx-auto space-y-8">
            
            {/* Primary Theme */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Palette size={16} />
                    Primary Theme
                 </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 group
                      ${theme === t.id 
                        ? 'bg-zinc-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                        : 'bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'}
                    `}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${t.color} ${theme === t.id ? 'animate-pulse' : 'opacity-50 group-hover:opacity-100 transition-opacity'}`}></div>
                    <span className={`text-sm font-medium ${theme === t.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-zinc-900">
               {/* Animation Style */}
               <div className="space-y-3">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Zap size={16} />
                    Color Movement
                 </h3>
                 <div className="grid grid-cols-2 gap-2">
                    {ANIMATIONS.map(anim => (
                        <button
                            key={anim.id}
                            onClick={() => setAnimation(anim.id as any)}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all
                                ${animation === anim.id 
                                    ? 'bg-zinc-800 border-zinc-500 text-white' 
                                    : 'bg-[#0A0A0A] border-zinc-800 text-zinc-500 hover:border-zinc-700'}
                            `}
                        >
                            {anim.label}
                        </button>
                    ))}
                 </div>
               </div>

               {/* Monitor Size */}
               <div className="space-y-3">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Monitor size={16} />
                    Viewport Size
                 </h3>
                 <select 
                    value={monitor.id}
                    onChange={(e) => setMonitor(MONITOR_PRESETS.find(m => m.id === e.target.value) || MONITOR_PRESETS[0])}
                    className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                 >
                    {MONITOR_PRESETS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                 </select>
               </div>
            </div>
            
            <div className="pt-2 border-t border-zinc-900 space-y-3">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <BoxSelect size={16} />
                    Extras
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setAddFloatingFrame(!addFloatingFrame)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all
                            ${addFloatingFrame 
                                ? 'bg-zinc-900 border-cyan-500/50 text-white' 
                                : 'bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-zinc-700'}
                        `}
                    >
                        <span>Gen. Popup</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center
                            ${addFloatingFrame ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-600'}
                        `}>
                            {addFloatingFrame && <CheckCircle2 size={12} className="text-black" />}
                        </div>
                    </button>

                    {/* FLEX LAYOUT TOGGLE */}
                    <button
                        onClick={() => setUseFlex(!useFlex)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all
                            ${useFlex 
                                ? 'bg-zinc-900 border-purple-500/50 text-white' 
                                : 'bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-zinc-700'}
                        `}
                    >
                        <span>Use Flexbox</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center
                            ${useFlex ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'}
                        `}>
                            {useFlex && <Scale size={12} className="text-black" />}
                        </div>
                    </button>
                 </div>
            </div>

            {/* DUAL INPUT SECTION */}
            <div className="space-y-4 pt-2 border-t border-zinc-900">
               <div className="flex items-center justify-between px-1">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <LayoutTemplate size={16} />
                    Input Sources
                 </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  {/* Left: Image Upload */}
                  <div className="space-y-2">
                      <label className="text-xs text-zinc-500 font-mono">1. SCREENSHOT (Required)</label>
                      <div className="h-40">
                          <FileUpload onFileSelect={handleFileSelect} disabled={state.status === 'analyzing' || state.status === 'refining'} />
                      </div>
                  </div>

                  {/* Right: ASCII Paste */}
                  <div className="space-y-2 h-full flex flex-col">
                      <label className="text-xs text-zinc-500 font-mono">2. ASCII HEADER (Optional)</label>
                      <textarea
                        className="flex-grow w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl p-3 text-[10px] font-mono leading-none text-zinc-400 focus:outline-none focus:border-zinc-600 resize-none placeholder:text-zinc-700"
                        placeholder="Paste ASCII Art block here..."
                        value={asciiArt}
                        onChange={(e) => setAsciiArt(e.target.value)}
                        spellCheck={false}
                      />
                  </div>
              </div>
            </div>
        </section>

        {/* Loading States */}
        {(state.status === 'analyzing' || state.status === 'refining') && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                <div className={`absolute inset-0 blur-xl opacity-20 rounded-full ${state.status === 'refining' ? 'bg-purple-500' : 'bg-cyan-500'}`}></div>
                <Loader2 className={`w-12 h-12 animate-spin relative z-10 ${state.status === 'refining' ? 'text-purple-400' : 'text-cyan-400'}`} />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-white">
                    {state.status === 'refining' ? 'Refining Layout Specification...' : 'Analyzing Layout Hierarchy...'}
                </p>
                <p className="text-sm text-zinc-500 animate-pulse">
                    {state.status === 'refining' ? 'Applying your instructions...' : loadingMsg}
                </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center text-sm font-mono">
            Error: {state.error}
          </div>
        )}

        {/* Results Section */}
        {state.status === 'success' && state.data && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
            
            {/* Visual Preview Column */}
            <div className="space-y-6">
              
              {/* Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    Preview
                    </h3>
                    <span className="text-xs font-mono text-zinc-600">
                        {state.data.meta.cols}x{state.data.meta.rows}
                    </span>
                </div>
                <Preview data={state.data} />
              </div>

               {/* Refinement Chat */}
               <div className="space-y-3 bg-[#0A0A0A] border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <MessageSquare size={16} className="text-purple-400" />
                      Iterative Refinement
                  </h3>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-grow bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 placeholder:text-zinc-600"
                        placeholder="e.g. 'Make the sidebar narrower', 'Move the log to top'..."
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      />
                      <button 
                        onClick={handleRefine}
                        disabled={!refinePrompt.trim()}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                          <Send size={16} />
                      </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                      Gemini will modify the JSON structure based on your natural language instruction.
                  </p>
               </div>

               {/* Original Image */}
               {state.imageUrl && (
                 <div className="opacity-50 hover:opacity-100 transition-opacity">
                    <p className="text-xs text-zinc-500 mb-2">Original Input Source:</p>
                    <img src={state.imageUrl} alt="Original" className="w-full rounded border border-zinc-800 grayscale hover:grayscale-0 transition-all duration-500" />
                 </div>
              )}
            </div>

            {/* JSON Output Column */}
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Code2 size={16} />
                  Generated Specification
                </h3>
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors"
                >
                    <Copy size={12} />
                    Copy JSON
                </button>
              </div>
              
              <div className="relative flex-grow group">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/50 to-transparent pointer-events-none rounded-lg border border-white/5"></div>
                <pre className="w-full h-[600px] overflow-auto p-4 bg-[#0A0A0A] rounded-lg border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed shadow-inner">
                  {JSON.stringify(state.data, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;