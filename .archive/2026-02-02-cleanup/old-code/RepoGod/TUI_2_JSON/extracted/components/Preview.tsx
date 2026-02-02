import React from 'react';
import { TerminalLayoutSpec, LayoutNode } from '../types';

interface PreviewProps {
  data: TerminalLayoutSpec;
}

// Map themes to a representative primary color (Tailwind class format for convenience or hex)
const THEME_COLORS: Record<string, { border: string, text: string }> = {
    'floyd-neon': { border: 'border-cyan-400', text: 'text-cyan-400' },
    'dracula':    { border: 'border-purple-400', text: 'text-purple-400' },
    'solarized':  { border: 'border-yellow-400', text: 'text-yellow-400' },
    'monokai':    { border: 'border-orange-400', text: 'text-orange-400' },
    'gruvbox':    { border: 'border-green-400', text: 'text-green-400' },
    'synthwave':  { border: 'border-pink-500', text: 'text-pink-500' },
    'nord':       { border: 'border-blue-300', text: 'text-blue-300' },
    'auto':       { border: 'border-zinc-400', text: 'text-zinc-400' }, // fallback
};

const Preview: React.FC<PreviewProps> = ({ data }) => {
  const { cols, rows } = data.meta;
  const { preset, secondaryPreset, dualMode, animation, custom } = data.theme;

  const aspectRatio = cols / (rows * 2); 

  // Determine the color class for a node
  const getNodeColor = (nodeX: number, detectedColor: string): { border?: string, text?: string, style?: React.CSSProperties } => {
    // 0. Custom Theme Extraction Logic
    if (preset === 'auto' && custom) {
         // Apply custom colors
         const isSecondaryArea = secondaryPreset || (detectedColor === 'magenta' || detectedColor === 'blue');
         const color = (isSecondaryArea && custom.secondary) ? custom.secondary : custom.primary;
         
         return {
             style: {
                 borderColor: color,
                 color: color
             }
         };
    }

    // 1. If dual theme SPLIT mode is active
    if (secondaryPreset && dualMode === 'split') {
        const midpoint = cols / 2;
        if (nodeX >= midpoint) {
             return THEME_COLORS[secondaryPreset] || THEME_COLORS['floyd-neon'];
        }
        return THEME_COLORS[preset] || THEME_COLORS['floyd-neon'];
    }

    // 2. If dual theme BLEND mode is active AND Gradient animation is on
    if (secondaryPreset && dualMode === 'blend' && animation === 'gradient') {
         return THEME_COLORS[preset]; 
    }

    // 3. Fallback to primary theme color
    if (detectedColor === 'red' || detectedColor === 'green') {
         switch (detectedColor) {
             case 'red': return { border: 'border-red-500', text: 'text-red-500' };
             case 'green': return { border: 'border-green-500', text: 'text-green-500' };
         }
    }
    
    return THEME_COLORS[preset] || THEME_COLORS['floyd-neon'];
  };

  const getAnimationClass = () => {
      switch(animation) {
          case 'breathe': return 'animate-breathe';
          case 'rolling': return 'animate-roll';
          case 'gradient': return 'animate-gradient-flow';
          default: return '';
      }
  };

  const getBorderStyle = (style: string, type: string) => {
     if (type === 'frame') return 'border-dashed opacity-70';
     switch (style) {
        case 'dashed': return 'border-dashed';
        case 'dotted': return 'border-dotted';
        case 'double': return 'border-double'; 
        default: return 'border-solid';
     }
  };

  const getBorderRadius = (style: string) => {
    if (style === 'round') return 'rounded-lg';
    return 'rounded-none';
  };

  const getBorderWidth = (style: string, type: string) => {
    if (type === 'frame') return 'border';
    if (style === 'bold') return 'border-2';
    if (style === 'double') return 'border-4'; 
    return 'border';
  };
  
  const getPaddingClass = (padding: number) => {
    switch(padding) {
        case 2: return 'p-[1.5%]'; 
        case 1: return 'p-[0.75%]'; 
        default: return 'p-0';
    }
  };

  const RenderNode: React.FC<{ node: LayoutNode, parentW: number, parentH: number, zIndex?: number, absX: number }> = ({ node, parentW, parentH, zIndex = 10, absX }) => {
    const left = (node.rect.x / parentW) * 100;
    const top = (node.rect.y / parentH) * 100;
    const width = (node.rect.w / parentW) * 100;
    const height = (node.rect.h / parentH) * 100;
    
    const colorResult = getNodeColor(absX + node.rect.x, node.style.color);
    const radiusClass = getBorderRadius(node.style.borderStyle);
    const borderTypeClass = getBorderStyle(node.style.borderStyle, node.type);
    const borderWidthClass = getBorderWidth(node.style.borderStyle, node.type);
    const paddingClass = getPaddingClass(node.style.padding);
    const animClass = getAnimationClass();

    const isFrame = node.type === 'frame';
    const bgClass = isFrame ? 'bg-transparent' : 'bg-zinc-900/80 backdrop-blur-[1px]';

    let styleObj: React.CSSProperties = {
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        boxSizing: 'border-box',
        zIndex: zIndex,
        ...colorResult.style // Apply custom hex styles if present
    };

    // If we have custom hex styles, we don't rely on tailwind text/border color classes as much, 
    // but we still need the border-width/style classes.
    let finalBorderClass = colorResult.style ? '' : (colorResult.border || '');
    let finalTextClass = colorResult.style ? '' : (colorResult.text || '');

    return (
      <div
        className={`absolute flex flex-col ${finalBorderClass} ${finalTextClass} ${radiusClass} ${borderWidthClass} ${borderTypeClass} ${bgClass} ${paddingClass} ${animClass} transition-all hover:bg-zinc-800/80 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] group overflow-hidden`}
        style={styleObj}
        onMouseEnter={(e) => e.stopPropagation()} 
      >
        {node.content.title && (
          <div className={`absolute top-0 left-2 -translate-y-[50%] px-1 text-[9px] font-bold tracking-wider uppercase border border-transparent z-20 whitespace-nowrap overflow-hidden max-w-full text-ellipsis
            ${isFrame ? 'bg-[#09090b] text-zinc-300' : 'bg-[#09090b]'}`}
             style={colorResult.style ? { color: colorResult.style.color } : {}}
            >
            {node.content.title}
          </div>
        )}
        
        {/* Semantic / Flexbox / Interaction Info Tag */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 flex flex-col items-end gap-1">
             <span className="bg-black/90 px-1.5 py-0.5 rounded text-[10px] text-white border border-zinc-700 whitespace-nowrap">
                {node.type}
             </span>
             {node.style.flexDirection && (
                 <span className="bg-purple-900/80 px-1.5 py-0.5 rounded text-[9px] text-purple-200 border border-purple-700 whitespace-nowrap">
                    flex: {node.style.flexDirection}
                 </span>
             )}
        </div>

        {/* ASCII Body / Content Render */}
        {node.content.body && (
           <div className="flex-1 w-full h-full overflow-hidden p-2 opacity-80">
               <pre className="text-[0.6rem] leading-[0.7rem] font-mono whitespace-pre w-full h-full overflow-hidden select-none">
                   {node.content.body}
               </pre>
           </div>
        )}

        {/* Render Children */}
        {node.children && node.children.length > 0 && (
          <div className="relative w-full h-full">
            {node.children.map(child => (
              <RenderNode 
                key={child.id} 
                node={child} 
                parentW={node.rect.w} 
                parentH={node.rect.h}
                zIndex={zIndex + 1}
                absX={absX + node.rect.x}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden bg-black rounded-lg border border-zinc-800 shadow-2xl relative">
        <div className="absolute top-0 left-0 px-2 py-1 bg-zinc-900 text-[10px] text-zinc-500 font-mono border-b border-r border-zinc-800 z-10">
            PREVIEW ({cols}x{rows}) 
            {secondaryPreset ? ` [${preset} + ${secondaryPreset}]` : ` [${preset}]`}
            {animation !== 'none' ? ` [${animation}]` : ''}
            {custom && ` [CUSTOM HEX]`}
        </div>
      <div 
        className="relative w-full bg-[#09090b] p-4 transition-all duration-300"
        style={{ 
            fontFamily: 'monospace',
            aspectRatio: `${aspectRatio * 1.8}`,
            backgroundColor: (preset === 'auto' && custom?.background) ? custom.background : '#09090b'
        }}
      >
        <div className="w-full h-full relative">
            {data.nodes.map((node, i) => (
                <RenderNode 
                    key={node.id} 
                    node={node} 
                    parentW={cols} 
                    parentH={rows} 
                    zIndex={10 + i} 
                    absX={node.rect.x}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Preview;