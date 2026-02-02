# ***~Floyd CLI Systematic Refactor Plan~***


Built by Claude
# FOR CLAUDE TO USE THERE ARE Available MCP Tools 
(46 tools across 6 servers)¨

## Floyd Patch Server (5 tools)
- `apply_unified_diff` - Apply patches (dry-run, risk assessment)
- `edit_range` - Edit specific line range
- `insert_at` - Insert at line number
- `delete_range` - Delete line range
- `assess_patch_risk` - Risk assessment before patching

## Floyd Runner Server (6 tools)
- `detect_project` - Auto-detect project type and commands
- `run_tests` - Run test suite
- `format` - Format code
- `lint` - Run linter
- `build` - Build project
- `check_permission` - Check if permission granted

## Floyd Supercache Server (12 tools)
- `cache_store`, `cache_retrieve`, `cache_delete`, `cache_clear`, `cache_list`, `cache_search`, `cache_stats`, `cache_prune`
- `cache_store_pattern` - Store code patterns
- `cache_store_reasoning`, `cache_load_reasoning`, `cache_archive_reasoning` - Reasoning persistence

## Floyd Safe Ops Server (3 tools)
- `safe_refactor` - Refactoring with rollback
- `impact_simulate` - Simulate change impact
- `verify` - Verify changes didn't break functionality

## Floyd Terminal Server (10 tools)
- `start_process`, `interact_with_process`, `read_process_output`, `force_terminate`
- `list_sessions`, `list_processes`, `kill_process`
- `execute_code`, `create_directory`, `get_file_info`

## Novel Concepts Server (10 tools)
- `compute_budget_allocator` - Allocate reasoning across tasks
- `concept_web_weaver` - Knowledge graph weaving
- `episodic_memory_bank` - Cross-session memory
- `analogy_synthesizer` - Generate analogies
- `semantic_diff_validator` - Semantic difference validation
- `refactoring_orchestrator` - Multi-file refactoring
- `consensus_protocol` - Build reasoning consensus
- `distributed_task_board` - Distributed task management
- `adaptive_context_compressor` - Compress context intelligently
- `execution_trace_synthesizer` - Debugging trace synthesis







 **Date**: 2026-01-29
 **Scope**: 41 items total (18 original + 5 high-priority + 4 architectural + 14 Claude alignment)
 **Strategy**: Root-cause-first with cascading-risk-aware phases + Claude system parity                                                                                                                                                     
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **ROOT CAUSE ANALYSIS**                                                                                                                                                                                             
                                                                                                                                                                                                                 
 **Fix Classification**                                                                                                                                                                                              
 ┌────────────────────┬────────────┬─────────────────────────────────────┬────────────────────────────┐                                                                                                          
 │    Original Fix    │    Type    │             Root Cause              │       Cascading Risk       │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Terminal ENOENT    │ SYMPTOM    │ No shell environment initialization │ HIGH - affects 30+ tools   │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ YOLO Mode          │ ROOT_CAUSE │ Fragmented permission system        │ HIGH - security model      │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Dynamic Prompts    │ ROOT_CAUSE │ Static templates don't adapt        │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Tool Validation    │ SYMPTOM    │ No validation middleware            │ MEDIUM - error propagation │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Error Responses    │ SYMPTOM    │ No unified error strategy           │ MEDIUM - UX impact         │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Edit File Matching │ SYMPTOM    │ No fuzzy matching option            │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Cache Tools        │ SYMPTOM    │ Unclear descriptions                │ LOW - UX only              │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ File Read Default  │ SYMPTOM    │ API design issue                    │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Dry-Run            │ SYMPTOM    │ Missing feature                     │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Cache Migration    │ SYMPTOM    │ Missing feature                     │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Git Protection     │ SYMPTOM    │ Warning-only implementation         │ MEDIUM - data loss         │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Browser Errors     │ SYMPTOM    │ Generic error messages              │ LOW - UX only              │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Grep Modes         │ SYMPTOM    │ Missing features                    │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Browser Click      │ SYMPTOM    │ Two-step process                    │ LOW - UX only              │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Transactions       │ SYMPTOM    │ No rollback mechanism               │ MEDIUM - data consistency  │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Smart Search       │ SYMPTOM    │ Missing feature                     │ LOW - UX only              │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Cache Stats        │ SYMPTOM    │ Missing metrics                     │ LOW - localized            │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Complexity         │ ROOT_CAUSE │ No task triage                      │ MEDIUM - efficiency        │                                                                                                          
 ├────────────────────┼────────────┼─────────────────────────────────────┼────────────────────────────┤                                                                                                          
 │ Retry Guard        │ ROOT_CAUSE │ No loop detection                   │ MEDIUM - efficiency        │                                                                                                          
 └────────────────────┴────────────┴─────────────────────────────────────┴────────────────────────────┘                                                                                                          
 **Missing Critical Architectural Fixes**                                                                                                                                                                            
 ┌──────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐                                                                                                             
 │         Fix          │  Impact  │                          Why Missing                          │                                                                                                             
 ├──────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                             
 │ **Provider Abstraction** │ CRITICAL │ GLM uses OpenAI format, code expects Anthropic - API failures │                                                                                                             
 ├──────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                             
 │ **State Management**     │ HIGH     │ Separate stores, no centralized state - consistency issues    │                                                                                                             
 ├──────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                             
 │ **Configuration**        │ HIGH     │ Hardcoded defaults scattered - maintenance nightmare          │                                                                                                             
 ├──────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                             
 │ **Permission System**    │ HIGH     │ UI/Policy/Registry fragmented - security model violation      │                                                                                                             
 └──────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘                                                                                                             
 ---                                                                                                                                                                                                             
 **EXECUTION STRATEGY**                                                                                                                                                                                              
                                                                                                                                                                                                                 
 **Must-Fix-Together Groups**                                                                                                                                                                                        
                                                                                                                                                                                                                 
 **GROUP A: Architectural Foundation** (Phase 0)                                                                                                                                                                     
- Items A-D below are tightly coupled                                                                                                                                                                           
- Fixing one without others will break the system                                                                                                                                                               
- Risk: HIGH - affects entire system                                                                                                                                                                            
- Time: 3-4 hours                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **GROUP B: Permission System** (Phase 1)                                                                                                                                                                            
- YOLO mode + permission descriptions                                                                                                                                                                           
- Must fix together to avoid security issues                                                                                                                                                                    
- Risk: HIGH - security model                                                                                                                                                                                   
                                                                                                                                                                                                                 
 **GROUP C: Tool Execution** (Phase 2)                                                                                                                                                                               
- Terminal ENOENT + parameter validation + error responses                                                                                                                                                      
- Related to how tools execute                                                                                                                                                                                  
- Risk: MEDIUM - tool reliability                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Can Fix Separately**                                                                                                                                                                                              
                                                                                                                                                                                                                 
- All other fixes are relatively isolated                                                                                                                                                                       
- Low cascading risk                                                                                                                                                                                            
- Can be done incrementally                                                                                                                                                                                     
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **PHASE 0: ARCHITECTURAL FOUNDATION (FIX TOGETHER)**                                                                                                                                                                
                                                                                                                                                                                                                 
 **RISK**: HIGH                                                                                                                                                                                                      
 **TIME**: 3-4 hours                                                                                                                                                                                                 
 **MUST FIX TOGETHER**: These 4 items are tightly coupled                                                                                                                                                            
                                                                                                                                                                                                                 
 **Item A: Unified Permission System (NEW - CRITICAL)**                                                                                                                                                              
                                                                                                                                                                                                                 
 **Problem**: Permission behavior varies across CLI, wrapper, Desktop. YOLO mode hardcoded differently.                                                                                                              
                                                                                                                                                                                                                 
 **Root Cause**: No unified permission abstraction. Each component implements its own checks.                                                                                                                        
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- INK/floyd-cli/src/permissions/tool-policy.ts (lines 159-169)                                                                                                                                                  
- floyd-wrapper-main/src/permissions/permission-manager.ts                                                                                                                                                      
- INK/floyd-cli/src/permissions/risk-classifier.ts                                                                                                                                                              
- INK/floyd-cli/src/ui/permissions/ask-overlay.tsx                                                                                                                                                              
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // NEW: packages/floyd-agent-core/src/permissions/unified-permission.ts                                                                                                                                         
 export interface PermissionStrategy {                                                                                                                                                                           
   name: ExecutionMode;                                                                                                                                                                                          
   check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;                                                                                                                                   
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export class UnifiedPermissionManager {                                                                                                                                                                         
   private strategies: Map<ExecutionMode, PermissionStrategy> = new Map();                                                                                                                                       
   private currentMode: ExecutionMode = 'ASK';                                                                                                                                                                   
                                                                                                                                                                                                                 
   setMode(mode: ExecutionMode): void {                                                                                                                                                                          
     this.currentMode = mode;                                                                                                                                                                                    
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision {                                                                                                                                  
     const strategy = this.strategies.get(this.currentMode);                                                                                                                                                     
     return strategy.check(tool, context);                                                                                                                                                                       
   }                                                                                                                                                                                                             
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 const YOLO_STRATEGY: PermissionStrategy = {                                                                                                                                                                     
   name: 'YOLO',                                                                                                                                                                                                 
   check: (tool, ctx) => {                                                                                                                                                                                       
     if (tool.permission === 'dangerous') {                                                                                                                                                                      
       return { allowed: false, reason: 'Dangerous tool requires confirmation' };                                                                                                                                
     }                                                                                                                                                                                                           
     return { allowed: true, autoApproved: true };                                                                                                                                                               
   }                                                                                                                                                                                                             
 };                                                                                                                                                                                                              
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. All modes work consistently across CLI/wrapper/Desktop                                                                                                                                                       
2. Security audit of permission bypass paths                                                                                                                                                                    
3. Integration tests for all mode/tool combinations                                                                                                                                                             
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item B: Configuration Standardization (NEW - CRITICAL)**                                                                                                                                                          
                                                                                                                                                                                                                 
 **Problem**: Hardcoded defaults scattered. No single source of truth.                                                                                                                                               
                                                                                                                                                                                                                 
 **Root Cause**: Configuration fragmented across multiple files.                                                                                                                                                     
                                                                                                                                                                                                                 
 **Files** (all need changes):                                                                                                                                                                                       
- floyd-wrapper-main/src/config/                                                                                                                                                                                
- INK/floyd-cli/src/utils/config.ts                                                                                                                                                                             
- FloydDesktopWeb/server/index.ts                                                                                                                                                                               
- Various files with hardcoded defaults                                                                                                                                                                         
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // NEW: packages/floyd-agent-core/src/config/floyd-config.ts                                                                                                                                                    
 export interface FloydConfig {                                                                                                                                                                                  
   // API                                                                                                                                                                                                        
   provider: 'anthropic' | 'glm' | 'openai';                                                                                                                                                                     
   apiKey: string;                                                                                                                                                                                               
   apiEndpoint: string;                                                                                                                                                                                          
   model: string;                                                                                                                                                                                                
                                                                                                                                                                                                                 
   // Mode                                                                                                                                                                                                       
   mode: ExecutionMode;                                                                                                                                                                                          
                                                                                                                                                                                                                 
   // Paths                                                                                                                                                                                                      
   workspacePath: string;                                                                                                                                                                                        
   cachePath: string;                                                                                                                                                                                            
                                                                                                                                                                                                                 
   // Prompts                                                                                                                                                                                                    
   promptStyle: PromptStyle;                                                                                                                                                                                     
                                                                                                                                                                                                                 
   // Permissions                                                                                                                                                                                                
   autoConfirm: boolean;                                                                                                                                                                                         
   allowDangerous: boolean;                                                                                                                                                                                      
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export class ConfigManager {                                                                                                                                                                                    
   private static instance: ConfigManager;                                                                                                                                                                       
   private config: FloydConfig;                                                                                                                                                                                  
                                                                                                                                                                                                                 
   static getInstance(): ConfigManager {                                                                                                                                                                         
     if (!this.instance) {                                                                                                                                                                                       
       this.instance = new ConfigManager();                                                                                                                                                                      
       // Load from config file, environment, defaults                                                                                                                                                           
     }                                                                                                                                                                                                           
     return this.instance;                                                                                                                                                                                       
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   get(): Readonly<FloydConfig> {                                                                                                                                                                                
     return this.config;                                                                                                                                                                                         
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   update(partial: Partial<FloydConfig>): void {                                                                                                                                                                 
     this.config = { ...this.config, ...partial };                                                                                                                                                               
     this.notifySubscribers();                                                                                                                                                                                   
   }                                                                                                                                                                                                             
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. All components read from ConfigManager                                                                                                                                                                       
2. Config file loading from ~/.floyd/config.json                                                                                                                                                                
3. Runtime updates propagate to all subscribers                                                                                                                                                                 
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item C: Provider Abstraction Layer (NEW - CRITICAL)**                                                                                                                                                             
                                                                                                                                                                                                                 
 **Problem**: GLM uses OpenAI format, code has mixed expectations. No unified interface.                                                                                                                             
                                                                                                                                                                                                                 
 **Root Cause**: Missing LLM client abstraction. Provider-specific code scattered.                                                                                                                                   
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- floyd-wrapper-main/src/llm/glm-client.ts (OpenAI format)                                                                                                                                                      
- Any direct Anthropic SDK usage                                                                                                                                                                                
- packages/floyd-agent-core/src/ (needs interface)                                                                                                                                                              
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // NEW: packages/floyd-agent-core/src/llm/llm-client.ts                                                                                                                                                         
 export interface LLMClient {                                                                                                                                                                                    
   streamChat(options: StreamOptions): AsyncGenerator<StreamEvent>;                                                                                                                                              
   cancel(): void;                                                                                                                                                                                               
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export interface StreamOptions {                                                                                                                                                                                
   messages: FloydMessage[];                                                                                                                                                                                     
   tools?: ToolDefinition[];                                                                                                                                                                                     
   maxTokens?: number;                                                                                                                                                                                           
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export interface StreamEvent {                                                                                                                                                                                  
   type: 'token' | 'tool_use' | 'complete' | 'error';                                                                                                                                                            
   data: unknown;                                                                                                                                                                                                
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 // GLM Implementation (OpenAI-compatible)                                                                                                                                                                       
 export class GLMClient implements LLMClient {                                                                                                                                                                   
   constructor(config: FloydConfig) {                                                                                                                                                                            
     this.config = config;                                                                                                                                                                                       
     this.endpoint = config.apiEndpoint; // OpenAI format endpoint                                                                                                                                               
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   async *streamChat(options: StreamOptions): AsyncGenerator<StreamEvent> {                                                                                                                                      
     // Use OpenAI-compatible format for GLM                                                                                                                                                                     
     const response = await fetch(this.endpoint, {                                                                                                                                                               
       method: 'POST',                                                                                                                                                                                           
       headers: {                                                                                                                                                                                                
         'Content-Type': 'application/json',                                                                                                                                                                     
         'Authorization': `Bearer ${this.config.apiKey}`                                                                                                                                                         
       },                                                                                                                                                                                                        
       body: JSON.stringify({                                                                                                                                                                                    
         model: this.config.model,                                                                                                                                                                               
         messages: options.messages,                                                                                                                                                                             
         tools: options.tools,                                                                                                                                                                                   
         stream: true                                                                                                                                                                                            
       })                                                                                                                                                                                                        
     });                                                                                                                                                                                                         
     // Parse SSE stream...                                                                                                                                                                                      
   }                                                                                                                                                                                                             
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 // Factory                                                                                                                                                                                                      
 export function createLLMClient(provider: string, config: FloydConfig): LLMClient {                                                                                                                             
   const implementations = {                                                                                                                                                                                     
     'glm': GLMClient,                                                                                                                                                                                           
     'anthropic': AnthropicClient,                                                                                                                                                                               
     'openai': OpenAIClient                                                                                                                                                                                      
   };                                                                                                                                                                                                            
   return new implementations[provider](config);                                                                                                                                                                 
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. GLM streaming works with tool calls                                                                                                                                                                          
2. Can switch providers via config                                                                                                                                                                              
3. Error handling consistent across providers                                                                                                                                                                   
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item D: State Management Unification (NEW - HIGH)**                                                                                                                                                               
                                                                                                                                                                                                                 
 **Problem**: Separate stores in CLI, Desktop, wrapper. No synchronization.                                                                                                                                          
                                                                                                                                                                                                                 
 **Root Cause**: Each component manages own state independently.                                                                                                                                                     
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- INK/floyd-cli/src/store/floyd-store.ts (787 lines)                                                                                                                                                            
- FloydDesktopWeb/ (different state)                                                                                                                                                                            
- floyd-wrapper-main/ (no centralized state)                                                                                                                                                                    
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // NEW: packages/floyd-agent-core/src/state/floyd-state.ts                                                                                                                                                      
 export interface FloydState {                                                                                                                                                                                   
   // Session                                                                                                                                                                                                    
   sessionId: string;                                                                                                                                                                                            
   messages: FloydMessage[];                                                                                                                                                                                     
                                                                                                                                                                                                                 
   // Execution                                                                                                                                                                                                  
   currentMode: ExecutionMode;                                                                                                                                                                                   
   activeTools: string[];                                                                                                                                                                                        
                                                                                                                                                                                                                 
   // Cache                                                                                                                                                                                                      
   cacheStats: CacheStats;                                                                                                                                                                                       
                                                                                                                                                                                                                 
   // UI (optional, for Desktop/CLI)                                                                                                                                                                             
   uiState?: Record<string, unknown>;                                                                                                                                                                            
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export class StateManager {                                                                                                                                                                                     
   private state: FloydState;                                                                                                                                                                                    
   private subscribers: Set<(state: FloydState) => void> = new Set();                                                                                                                                            
                                                                                                                                                                                                                 
   getState(): Readonly<FloydState> {                                                                                                                                                                            
     return this.state;                                                                                                                                                                                          
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   setState(updater: (state: FloydState) => Partial<FloydState>): void {                                                                                                                                         
     const updates = updater(this.state);                                                                                                                                                                        
     this.state = { ...this.state, ...updates };                                                                                                                                                                 
     this.notify();                                                                                                                                                                                              
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   subscribe(callback: (state: FloydState) => void): () => void {                                                                                                                                                
     this.subscribers.add(callback);                                                                                                                                                                             
     return () => this.subscribers.delete(callback);                                                                                                                                                             
   }                                                                                                                                                                                                             
                                                                                                                                                                                                                 
   private notify(): void {                                                                                                                                                                                      
     for (const sub of this.subscribers) {                                                                                                                                                                       
       sub(this.state);                                                                                                                                                                                          
     }                                                                                                                                                                                                           
   }                                                                                                                                                                                                             
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 // Singleton instance                                                                                                                                                                                           
 export const globalState = new StateManager();                                                                                                                                                                  
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. State updates propagate to all subscribers                                                                                                                                                                   
2. No memory leaks from subscriptions                                                                                                                                                                           
3. Race conditions handled                                                                                                                                                                                      
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **PHASE 1: CRITICAL FIXES (ROOT CAUSES)**                                                                                                                                                                           
                                                                                                                                                                                                                 
 **Item 1: Dynamic Prompt Generation**                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Problem**: Hardcoded tool descriptions in system-prompt.ts. Drift from AVAILABLE_TOOLS.                                                                                                                           
                                                                                                                                                                                                                 
 **Root Cause**: Static prompt templates don't adapt to runtime tool changes.                                                                                                                                        
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- INK/floyd-cli/src/prompts/system-prompt.ts                                                                                                                                                                    
- INK/floyd-cli/src/config/available-tools.ts                                                                                                                                                                   
- floyd-wrapper-main/src/prompts/system/capabilities.ts (also hardcoded)                                                                                                                                        
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // Replace hardcoded getToolCapabilities()                                                                                                                                                                      
 export function getToolCapabilities(): string {                                                                                                                                                                 
   const categories = getToolsByCategory();                                                                                                                                                                      
   let output = `## Tool Capabilities (${AVAILABLE_TOOLS.length} Tools)\n\n`;                                                                                                                                    
                                                                                                                                                                                                                 
   for (const [category, tools] of Object.entries(categories)) {                                                                                                                                                 
     output += `### ${category.toUpperCase()} (${tools.length} tools)\n`;                                                                                                                                        
     for (const tool of tools) {                                                                                                                                                                                 
       const perm = tool.permission ? ` [${tool.permission.toUpperCase()}]` : '';                                                                                                                                
       output += `- **${tool.name}**${perm}: ${tool.description}\n`;                                                                                                                                             
     }                                                                                                                                                                                                           
     output += '\n';                                                                                                                                                                                             
   }                                                                                                                                                                                                             
   return output;                                                                                                                                                                                                
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. Build CLI, verify tool count matches                                                                                                                                                                         
2. Add tool to AVAILABLE_TOOLS, rebuild, verify appears                                                                                                                                                         
3. Check wrapper capabilities.ts also updated                                                                                                                                                                   
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 2: YOLO Mode Permission Consistency**                                                                                                                                                                        
                                                                                                                                                                                                                 
 **Problem**: Tool descriptions say "requires permission" but YOLO auto-approves moderate tools.                                                                                                                     
                                                                                                                                                                                                                 
 **Root Cause**: Fragmented permission system (see Item A Phase 0).                                                                                                                                                  
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- INK/floyd-cli/src/config/available-tools.ts                                                                                                                                                                   
- System prompt mode descriptions                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Quick Fix** (until Phase 0 Item A complete):                                                                                                                                                                      
1. Remove "requires permission" from all tool descriptions                                                                                                                                                      
2. Add mode-specific guidance to system prompt                                                                                                                                                                  
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // Update available-tools.ts descriptions                                                                                                                                                                       
 // Remove all instances of "Requires permission." or similar                                                                                                                                                    
                                                                                                                                                                                                                 
 // Update system prompt mode description                                                                                                                                                                        
 case 'YOLO':                                                                                                                                                                                                    
   return `You are in YOLO mode. Tools with permission 'none' and 'moderate' are auto-approved.                                                                                                                  
          Only 'dangerous' tools require confirmation.`;                                                                                                                                                         
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. Grep for "requires permission" - should find none                                                                                                                                                            
2. Set YOLO mode, test moderate/dangerous tools                                                                                                                                                                 
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 3: Desktop promptStyle UI Selector**                                                                                                                                                                         
                                                                                                                                                                                                                 
 **Problem**: API supports promptStyle but frontend doesn't expose it.                                                                                                                                               
                                                                                                                                                                                                                 
 **Root Cause**: Incomplete feature implementation.                                                                                                                                                                  
                                                                                                                                                                                                                 
 **Files**:                                                                                                                                                                                                          
- FloydDesktopWeb/server/index.ts                                                                                                                                                                               
- FloydDesktopWeb/server/prompts/ (need claude/floyd/custom styles)                                                                                                                                             
- Client UI (needs selector component)                                                                                                                                                                          
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
1. Add promptStyle to Settings interface                                                                                                                                                                        
2. Implement prompt builders for all 4 styles                                                                                                                                                                   
3. Add UI dropdown selector                                                                                                                                                                                     
4. Wire up to API                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. Settings page shows promptStyle selector                                                                                                                                                                     
2. Switching styles changes behavior                                                                                                                                                                            
3. Screenshot of UI                                                                                                                                                                                             
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **PHASE 2: TOOL EXECUTION FIXES (SYMPTOMS BUT HIGH IMPACT)**                                                                                                                                                        
                                                                                                                                                                                                                 
 **Item 4: Terminal Tool ENOENT (Shell Environment)**                                                                                                                                                                
                                                                                                                                                                                                                 
 **Problem**: Commands fail with ENOENT (ls, echo fail, pwd works).                                                                                                                                                  
                                                                                                                                                                                                                 
 **Root Cause**: No shell environment initialization. PATH not properly inherited.                                                                                                                                   
                                                                                                                                                                                                                 
 **File**: floyd-wrapper-main/src/tools/system/index.ts                                                                                                                                                              
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // The fix is already correct - ensure process.env is inherited                                                                                                                                                 
 const result = await execa(command, args, {                                                                                                                                                                     
   cwd: executionCwd,                                                                                                                                                                                            
   timeout,                                                                                                                                                                                                      
   env: {                                                                                                                                                                                                        
     ...process.env,  // This should work, but verify shell profile loaded                                                                                                                                       
     ...env                                                                                                                                                                                                      
   },                                                                                                                                                                                                            
   reject: false,                                                                                                                                                                                                
 });                                                                                                                                                                                                             
                                                                                                                                                                                                                 
 **IMPORTANT**: If simple PATH inheritance doesn't work, need full shell login:                                                                                                                                      
 // Alternative: Spawn with login shell for full environment                                                                                                                                                     
 const shell = process.env.SHELL || '/bin/bash';                                                                                                                                                                 
 const result = await execa(`${shell} -lc "${command} ${args.join(' ')}"`, {                                                                                                                                     
   cwd: executionCwd,                                                                                                                                                                                            
   timeout,                                                                                                                                                                                                      
   env: { ...process.env, ...env }                                                                                                                                                                               
 });                                                                                                                                                                                                             
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
 pwd    # ✅                                                                                                                                                                                                     
 ls -la # ✅                                                                                                                                                                                                     
 echo test # ✅                                                                                                                                                                                                  
 touch /tmp/floyd-test && rm /tmp/floyd-test # ✅                                                                                                                                                                
 npm test # ✅                                                                                                                                                                                                   
 git status # ✅                                                                                                                                                                                                 
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 5: Tool Parameter Validation**                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Problem**: read_text_file allows both head+tail, delete_range doesn't validate ranges.                                                                                                                            
                                                                                                                                                                                                                 
 **Root Cause**: No validation middleware before tool execution.                                                                                                                                                     
                                                                                                                                                                                                                 
 **File**: floyd-wrapper-main/src/tools/file/file-core.ts                                                                                                                                                            
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // Add validation at top of file-core.ts                                                                                                                                                                        
 interface ValidationError { field: string; message: string; }                                                                                                                                                   
                                                                                                                                                                                                                 
 function validateReadInput(input: ReadTextFileInput): ValidationError | null {                                                                                                                                  
   if (input.head !== undefined && input.tail !== undefined) {                                                                                                                                                   
     return { field: 'head,tail', message: 'Cannot specify both head and tail' };                                                                                                                                
   }                                                                                                                                                                                                             
   if (input.head !== undefined && input.head < 1) {                                                                                                                                                             
     return { field: 'head', message: 'head must be >= 1' };                                                                                                                                                     
   }                                                                                                                                                                                                             
   if (input.tail !== undefined && input.tail < 1) {                                                                                                                                                             
     return { field: 'tail', message: 'tail must be >= 1' };                                                                                                                                                     
   }                                                                                                                                                                                                             
   return null;                                                                                                                                                                                                  
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 // In readTextFile, before execution:                                                                                                                                                                           
 const validation = validateReadInput(input);                                                                                                                                                                    
 if (validation) {                                                                                                                                                                                               
   return {                                                                                                                                                                                                      
     success: false,                                                                                                                                                                                             
     error: { type: 'INVALID_INPUT', message: validation.message }                                                                                                                                               
   };                                                                                                                                                                                                            
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. Test invalid inputs return proper errors                                                                                                                                                                     
2. Test valid inputs still work                                                                                                                                                                                 
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 6: Standardized Error Responses**                                                                                                                                                                            
                                                                                                                                                                                                                 
 **Problem**: Tools fail silently or with minimal context.                                                                                                                                                           
                                                                                                                                                                                                                 
 **Root Cause**: No unified error interface.                                                                                                                                                                         
                                                                                                                                                                                                                 
 **File**: floyd-wrapper-main/src/tools/types.ts (NEW)                                                                                                                                                               
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 // Define standard error interface                                                                                                                                                                              
 export interface ToolError {                                                                                                                                                                                    
   type: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_INPUT' |                                                                                                                                              
         'COMMAND_NOT_FOUND' | 'BROWSER_EXTENSION_UNAVAILABLE' |                                                                                                                                                 
         'NO_MATCH_FOUND' | 'PROTECTED_BRANCH';                                                                                                                                                                  
   message: string;                                                                                                                                                                                              
   context?: Record<string, unknown>;                                                                                                                                                                            
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export interface ToolResponse<T = unknown> {                                                                                                                                                                    
   success: boolean;                                                                                                                                                                                             
   data?: T;                                                                                                                                                                                                     
   error?: ToolError;                                                                                                                                                                                            
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 // Update all tools to return this format                                                                                                                                                                       
 // Example for read_file:                                                                                                                                                                                       
 try {                                                                                                                                                                                                           
   await fs.access(filePath, fs.constants.R_OK);                                                                                                                                                                 
   const content = await fs.readFile(filePath, 'utf-8');                                                                                                                                                         
   return { success: true, data: content };                                                                                                                                                                      
 } catch (error) {                                                                                                                                                                                               
   const code = (error as NodeJS.ErrnoException).code;                                                                                                                                                           
   if (code === 'ENOENT') {                                                                                                                                                                                      
     return {                                                                                                                                                                                                    
       success: false,                                                                                                                                                                                           
       error: { type: 'FILE_NOT_FOUND', message: `File not found: ${filePath}` }                                                                                                                                 
     };                                                                                                                                                                                                          
   }                                                                                                                                                                                                             
   // ... other error types                                                                                                                                                                                      
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Verification**:                                                                                                                                                                                                   
1. All tools return ToolResponse format                                                                                                                                                                         
2. Error types distinguish ENOENT vs EACCES                                                                                                                                                                     
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **PHASE 3: PERFORMANCE & QUALITY OF LIFE**                                                                                                                                                                          
                                                                                                                                                                                                                 
 **Item 7: Complexity Classification**                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Problem**: Every task gets full reasoning regardless of complexity.                                                                                                                                               
                                                                                                                                                                                                                 
 **Root Cause**: No task triage before execution.                                                                                                                                                                    
                                                                                                                                                                                                                 
 **File**: floyd-wrapper-main/src/utils/complexity-classifier.ts (NEW)                                                                                                                                               
                                                                                                                                                                                                                 
 **Implementation**:                                                                                                                                                                                                 
 const SAFE_TOOLS = ['read_file', 'list_directory', 'grep', 'codebase_search'];                                                                                                                                  
 const DANGEROUS_TOOLS = ['delete_file', 'git_merge', 'force_terminate'];                                                                                                                                        
                                                                                                                                                                                                                 
 interface TaskComplexity {                                                                                                                                                                                      
   level: 'LOW' | 'MEDIUM' | 'HIGH';                                                                                                                                                                             
   reasoning: 'none' | 'brief' | 'full';                                                                                                                                                                         
   maxPlanningTokens: number;                                                                                                                                                                                    
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 export function classifyComplexity(tools: string[], fileCount: number): TaskComplexity {                                                                                                                        
   if (fileCount === 1 && tools.every(t => SAFE_TOOLS.includes(t))) {                                                                                                                                            
     return { level: 'LOW', reasoning: 'none', maxPlanningTokens: 100 };                                                                                                                                         
   }                                                                                                                                                                                                             
   if (fileCount <= 5 && !tools.some(t => DANGEROUS_TOOLS.includes(t))) {                                                                                                                                        
     return { level: 'MEDIUM', reasoning: 'brief', maxPlanningTokens: 500 };                                                                                                                                     
   }                                                                                                                                                                                                             
   return { level: 'HIGH', reasoning: 'full', maxPlanningTokens: 2000 };                                                                                                                                         
 }                                                                                                                                                                                                               
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 8: Retry Guard**                                                                                                                                                                                             
                                                                                                                                                                                                                 
 **Problem**: No detection when stuck in retry loops.                                                                                                                                                                
                                                                                                                                                                                                                 
 **Root Cause**: No loop detection mechanism.                                                                                                                                                                        
                                                                                                                                                                                                                 
 **File**: floyd-wrapper-main/src/utils/retry-guard.ts (NEW)                                                                                                                                                         
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 9-18: Remaining Quality of Life Fixes**                                                                                                                                                                      
                                                                                                                                                                                                                 
 These are lower priority symptom fixes with minimal cascading risk:                                                                                                                                             
- Edit File Fuzzy Matching                                                                                                                                                                                      
- Cache Tool Clarification                                                                                                                                                                                      
- File Read Full Content Default                                                                                                                                                                                
- Dry-Run Support                                                                                                                                                                                               
- Cache Tier Migration                                                                                                                                                                                          
- Git Branch Protection                                                                                                                                                                                         
- Browser Graceful Degradation                                                                                                                                                                                  
- Extended Grep Modes                                                                                                                                                                                           
- Browser Click Natural Language                                                                                                                                                                                
- Transaction Support                                                                                                                                                                                           
- Smart Search                                                                                                                                                                                                  
- Cache Usage Stats                                                                                                                                                                                             
                                                                                                                                                                                                                 
 (Implementation details same as before in original plan)                                                                                                                                                        
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **PHASE 4: TESTING & VERIFICATION**                                                                                                                                                                                 
                                                                                                                                                                                                                 
 **Item 19: E2E Tests for Desktop Tools**                                                                                                                                                                            
                                                                                                                                                                                                                 
 **Problem**: 34 new Desktop tools untested.                                                                                                                                                                         
                                                                                                                                                                                                                 
 **File**: FloydDesktopWeb/server/tool-executor.test.ts (NEW)                                                                                                                                                        
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 20: CLI Swarm Dispatch Verification**                                                                                                                                                                        
                                                                                                                                                                                                                 
 **Problem**: Swarm command needs verification with 60 tools.                                                                                                                                                        
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **Item 21: Testing Feedback List**                                                                                                                                                                                  
                                                                                                                                                                                                                 
 **Problem**: Testing feedback not tracked.                                                                                                                                                                          
                                                                                                                                                                                                                 
 **File**: INK/floyd-cli/docs/TESTING_FEEDBACK.md (NEW)                                                                                                                                                              
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **EXECUTION SUMMARY**                                                                                                                                                                                               
                                                                                                                                                                                                                 
 **Critical Path (Must Complete First)**

 Phase 0 (Architectural Foundation) → Phase 1 (Root Causes) → Phase 2 → Phase 3 → Phase 4 → Phase 5 (Claude Parity)
     [Items A-D]                      [Items 1-3]            [4-6]        [7-18]      [19-21]           [22-35]
          ↓                                 ↓                  ↓            ↓            ↓                 ↓
     HIGH RISK                      HIGH RISK           MEDIUM       LOW         TESTING          LOW (New Features)                                                                                                                         
   (FIX TOGETHER)                 (Security)          (Reliability)            (Coverage)                                                                                                                        
                                                                                                                                                                                                                 
 **Phase Breakdown**
 ┌───────┬────────────┬────────┬──────┬────────────────────────┬─────────────────┐
 │ Phase │   Items    │  Risk  │ Time │   Must Fix Together    │      Focus       │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 0     │ A-D (4)    │ HIGH   │ 3-4h │ YES                    │ Architecture    │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 1     │ 1-3 (3)    │ HIGH   │ 1-2h │ Partial (2 links to 0) │ Root Causes     │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 2     │ 4-6 (3)    │ MEDIUM │ 1h   │ NO                     │ Tool Exec       │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 3     │ 7-18 (12)  │ LOW    │ 2-3h │ NO                     │ Performance     │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 4     │ 19-21 (3)  │ LOW    │ 1h   │ NO                     │ Testing         │
 ├───────┼────────────┼────────┼──────┼────────────────────────┼─────────────────┤
 │ 5     │ 22-35 (14) │ LOW    │ 8-10d│ Partial (23→22)        │ Claude Parity   │
 └───────┴────────────┴────────┴──────┴────────────────────────┴─────────────────┘                                                                                                                                                  
 **New Files to Create**                                                                                                                                                                                             
 ┌─────────────────────────────────────────────────────────────────┬───────────────────────────┐                                                                                                                 
 │                              File                               │          Purpose          │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ packages/floyd-agent-core/src/permissions/unified-permission.ts │ Unified permission system │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ packages/floyd-agent-core/src/config/floyd-config.ts            │ Configuration manager     │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ packages/floyd-agent-core/src/llm/llm-client.ts                 │ Provider abstraction      │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ packages/floyd-agent-core/src/state/floyd-state.ts              │ State management          │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ floyd-wrapper-main/src/tools/types.ts                           │ ToolError interface       │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ floyd-wrapper-main/src/utils/complexity-classifier.ts           │ Task triage               │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ floyd-wrapper-main/src/utils/retry-guard.ts                     │ Loop detection            │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ FloydDesktopWeb/server/tool-executor.test.ts                    │ E2E tests                 │                                                                                                                 
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤                                                                                                                 
 │ INK/floyd-cli/docs/TESTING_FEEDBACK.md                          │ Testing tracker           │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ PHASE 5: CLAUDE ALIGNMENT (14 new files)                       │                           │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/hooks/types.ts                          │ Hook type definitions     │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/hooks/hook-manager.ts                    │ Hook execution system     │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/hooks/builtin-handlers.ts                │ Built-in hook handlers    │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/agents/frontmatter-loader.ts            │ Markdown agent parser      │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/modes/plan-mode.ts                       │ Planning mode system       │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/commands/plan.ts                         │ /plan command              │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/prompts/plan-prompt.ts                       │ Planning prompts           │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/tools/lsp/lsp-client.ts                  │ LSP client integration     │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/tools/lsp/lsp-tools.ts                   │ LSP tool implementations   │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/commands/pr.ts                           │ /pr command                │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/git/github-client.ts                     │ GitHub API client          │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/permissions/permission-cli.tsx               │ Permissions UI             │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/prompts/thinking-prompt.ts                    │ Thinking mode prompts      │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/ui/input/shortcuts.ts                         │ CLI keyboard shortcuts     │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/commands/context.ts                      │ /context command           │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/utils/context-tracker.ts                 │ Context tracking           │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/tools/notebook/notebook-tools.ts         │ Jupyter notebook tools     │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/ui/vim/vim-mode.ts                            │ Full Vim keybindings       │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ INK/floyd-cli/src/ui/history/history-search.tsx                 │ Ctrl+R history search      │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ floyd-wrapper-main/src/sessions/session-folder.ts               │ Session organization       │
 ├─────────────────────────────────────────────────────────────────┼───────────────────────────┤
 │ FloydDesktopWeb/server/mcp/resource-parser.ts                   │ MCP resource @-mentions    │
 └─────────────────────────────────────────────────────────────────┴───────────────────────────┘
 **Existing Files to Modify**                                                                                                                                                                                        
 ┌────────────────────────────────────────────────┬────────────────────────────┐                                                                                                                                 
 │                      File                      │          Changes           │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ INK/floyd-cli/src/prompts/system-prompt.ts     │ Dynamic tool generation    │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ INK/floyd-cli/src/config/available-tools.ts    │ Remove permission language │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ floyd-wrapper-main/src/tools/system/index.ts   │ Shell environment          │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ floyd-wrapper-main/src/tools/file/file-core.ts │ Validation, fuzzy, errors  │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ FloydDesktopWeb/server/cache-manager.ts        │ Migration, stats           │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ FloydDesktopWeb/server/index.ts                │ PromptStyle UI             │                                                                                                                                 
 ├────────────────────────────────────────────────┼────────────────────────────┤                                                                                                                                 
 │ Plus 10+ more for quality of life fixes        │                            │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ PHASE 5 MODIFICATIONS (7 files)                │                            │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ floyd-wrapper-main/src/agents/agent-registry.ts │ Add frontmatter loading    │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ floyd-wrapper-main/src/commands/permissions.ts │ Enhanced wildcard patterns │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ INK/floyd-cli/src/ui/components/Input.tsx     │ Add Ctrl+G, Vim mode       │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ floyd-wrapper-main/src/sessions/session-manager.ts │ Add folder support     │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ FloydDesktopWeb/server/mcp-client.ts           │ Add resource resolution    │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ .floyd/hooks.json                               │ Hooks configuration        │
 ├────────────────────────────────────────────────┼────────────────────────────┤
 │ .floyd/agents/*.md                             │ Agent definitions          │
 └────────────────────────────────────────────────┴────────────────────────────┘                                                                                                                                 
 ---                                                                                                                                                                                                             
 **VERIFICATION PROTOCOL**                                                                                                                                                                                           
                                                                                                                                                                                                                 
 **Per Phase**                                                                                                                                                                                                       
                                                                                                                                                                                                                 
1. **Build**: npm run build succeeds                                                                                                                                                                                
2. **Smoke Test**: Test all fixes in phase                                                                                                                                                                          
3. **Regression**: Ensure nothing broke                                                                                                                                                                             
4. **Code Diff**: Present actual diffs                                                                                                                                                                              
                                                                                                                                                                                                                 
 **Final Verification**                                                                                                                                                                                              
                                                                                                                                                                                                                 
1. All 41 items complete (27 original + 14 Claude alignment)
2. Full build succeeds
3. All smoke tests pass
4. E2E tests pass
5. Documentation updated
6. Claude parity checklist verified (see docs/alignment.md)                                                                                                                                                                                        
                                                                                                                                                                                                                 
 ---                                                                                                                                                                                                             
 **CASCADING RISK WARNINGS**                                                                                                                                                                                         
                                                                                                                                                                                                                 
1. **Phase 0 Item A (Permissions)**: Fixing without Items B-D will break permission system. DO ALL 4 TOGETHER.                                                                                                      
2. **Phase 1 Item 2 (YOLO)**: Depends on Phase 0 Item A. Complete Phase 0 first.                                                                                                                                    
3. **Phase 2 Item 4 (Terminal)**: If shell environment fix doesn't work, may need deeper changes to how commands spawn.                                                                                             
4. **Phase 2 Item 6 (Error Responses)**: Updating all tools to use new interface is tedious. Use automated refactoring where possible.                                                                              
5. **Provider Abstraction (Item C)**: GLM client working. Changes risk breaking streaming. TEST THOROUGHLY.

---
**PHASE 5: CLAUDE SYSTEM ALIGNMENT**

**RISK**: MEDIUM to LOW (mostly new features, minimal breaking changes)
**TIME**: 8-10 days
**STRATEGY**: Add missing Claude Desktop/Code/Cowork parity features while preserving FLOYD innovations

**Overview**: FLOYD has 60 tools (exceeds Claude's ~50), but lacks key Claude features in plugin ecosystem, hooks, multi-agent orchestration, and CLI UX. This phase adds parity items identified in docs/alignment.md while maintaining FLOYD's unique advantages (SUPERCACHE, Sandbox, Impact Simulation).

---

**Item 22: Hooks System (P0 - HIGH PRIORITY)**

**Problem**: No lifecycle event hooks for custom behavior injection. Claude supports SessionStart, PreToolUse, PostToolUse, PermissionRequest, Stop events.

**Root Cause**: Missing hooks architecture entirely.

**Files** (NEW):
- floyd-wrapper-main/src/hooks/types.ts
- floyd-wrapper-main/src/hooks/hook-manager.ts
- floyd-wrapper-main/src/hooks/builtin-handlers.ts

**Implementation**:
```typescript
// floyd-wrapper-main/src/hooks/types.ts
export type HookEvent =
  | 'SessionStart'     // When session begins
  | 'SessionEnd'       // When session ends
  | 'PreToolUse'       // Before tool execution
  | 'PostToolUse'      // After tool execution
  | 'PermissionRequest'// When permission needed
  | 'Stop';            // On interrupt

export interface Hook {
  event: HookEvent;
  command?: string;    // Command to execute
  handler?: string;    // Handler name (built-in)
  timeout?: number;    // Max execution time (ms)
  enabled: boolean;
}

// .floyd/hooks.json schema
interface HooksConfig {
  hooks: Hook[];
}

// floyd-wrapper-main/src/hooks/hook-manager.ts
export class HookManager {
  private hooks: Map<HookEvent, Hook[]> = new Map();

  async execute(event: HookEvent, context: HookContext): Promise<void> {
    const eventHooks = this.hooks.get(event) || [];
    for (const hook of eventHooks) {
      if (!hook.enabled) continue;
      if (hook.command) {
        await this.executeCommand(hook.command, context);
      } else if (hook.handler) {
        await this.executeBuiltin(hook.handler, context);
      }
    }
  }

  loadFromFile(path: string): void {
    // Load .floyd/hooks.json
  }
}
```

**Built-in Handlers** (auto_approve_safe_commands, log_tool_use, etc.)

**Verification**:
1. Create .floyd/hooks.json with test hook
2. Trigger SessionStart event, verify command runs
3. Test PreToolUse with permission override
4. Verify timeout enforcement

---

**Item 23: Agent Frontmatter Support (P0 - HIGH PRIORITY)**

**Problem**: No markdown frontmatter-based agent definitions. Claude supports .md files with YAML frontmatter for custom agents.

**Root Cause**: Agent system uses programmatic definitions only.

**Files**:
- floyd-wrapper-main/src/agents/frontmatter-loader.ts (NEW)
- floyd-wrapper-main/src/agents/agent-registry.ts (MODIFY)
- .floyd/agents/ (NEW directory)

**Implementation**:
```yaml
# .floyd/agents/code-reviewer.md
---
description: Expert code reviewer with security focus
model: glm-4.7
permissionMode: auto-allow
allowedTools:
  - Read
  - Grep
  - Bash
skills:
  - security/analysis
  - refactoring/patterns
context:
  fork: true
  once: false
---

You are a security-focused code reviewer. Analyze code for:
1. OWASP Top 10 vulnerabilities
2. Performance issues
3. Code smell and anti-patterns
```

```typescript
// frontmatter-loader.ts
export function loadAgentFromMarkdown(path: string): AgentDefinition {
  const content = fs.readFileSync(path, 'utf-8');
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) throw new Error('No frontmatter found');

  const frontmatter = parseYaml(match[1]);
  const instructions = content.slice(match[0].length).trim();

  return {
    name: path.split('/').pop()?.replace('.md', '') || 'unknown',
    ...frontmatter,
    instructions
  };
}
```

**Verification**:
1. Create .floyd/agents/test-agent.md
2. Invoke via @test-agent in CLI
3. Verify permission mode applied
4. Verify tool restrictions enforced

---

**Item 24: /plan Mode (P0 - HIGH PRIORITY)**

**Problem**: No dedicated planning mode with separate subagent. Claude has /plan that generates detailed step-by-step plans before execution.

**Root Cause**: No planning mode architecture.

**Files**:
- floyd-wrapper-main/src/modes/plan-mode.ts (NEW)
- floyd-wrapper-main/src/commands/plan.ts (NEW)
- INK/floyd-cli/src/prompts/plan-prompt.ts (NEW)

**Implementation**:
```typescript
// plan-mode.ts
export class PlanMode {
  /**
   * Enter planning mode:
   * 1. Switch to planning subagent (use faster model like Sonnet/Haiku)
   * 2. Generate detailed step-by-step plan
   * 3. Present plan for approval
   * 4. Execute only after approval
   */
  async enter(userGoal: string): Promise<PlanExecutionResult> {
    // Generate plan using planning-focused prompt
    const plan = await this.generatePlan(userGoal);

    // Present plan with formatted display
    this.displayPlan(plan);

    // Wait for user approval
    const approved = await this.waitForApproval();

    if (approved) {
      return this.executePlan(plan);
    } else {
      return { status: 'cancelled', plan };
    }
  }

  private async generatePlan(goal: string): Promise<Plan> {
    // Use planning-specific prompt with faster model
    const planPrompt = this.buildPlanPrompt(goal);
    // Request structured plan with dependencies
  }
}

interface Plan {
  goal: string;
  steps: PlanStep[];
  estimatedTime: string;
  risks: string[];
}

interface PlanStep {
  id: string;
  description: string;
  dependencies: string[];
  files: string[];
  tools: string[];
}
```

**CLI Integration**:
```bash
floyd plan "Add user authentication to the app"
# Generates plan, shows for approval, executes on yes
```

**Verification**:
1. Test plan generation for simple task
2. Verify plan displays with dependencies
3. Test approval flow (yes/cancel)
4. Test plan execution after approval

---

**Item 25: LSP Tool (P1 - MEDIUM PRIORITY)**

**Problem**: No code intelligence via LSP (go-to-definition, find references, hover). Claude has LSP integration.

**Root Cause**: Missing LSP client integration.

**Files**:
- floyd-wrapper-main/src/tools/lsp/lsp-client.ts (NEW)
- floyd-wrapper-main/src/tools/lsp/lsp-tools.ts (NEW)

**Implementation**:
```typescript
// lsp-client.ts
import { createLspConnection } from 'lsp-client';

export class LSPTool {
  private connections: Map<string, LspConnection> = new Map();

  async gotoDefinition(filePath: string, line: number, column: number): Promise<Location[]> {
    const lang = this.getLanguage(filePath);
    const conn = this.getConnection(lang);
    return conn.sendRequest('textDocument/definition', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }

  async findReferences(filePath: string, line: number, column: number): Promise<Location[]> {
    const conn = this.getConnection(this.getLanguage(filePath));
    return conn.sendRequest('textDocument/references', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }

  async hover(filePath: string, line: number, column: number): Promise<Hover> {
    const conn = this.getConnection(this.getLanguage(filePath));
    return conn.sendRequest('textDocument/hover', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }
}
```

**Tool Definitions**:
- `lsp_goto_definition` - Go to symbol definition
- `lsp_find_references` - Find all references
- `lsp_hover` - Get type/documentation at position
- `lsp_symbols` - List document symbols
- `lsp_rename` - Rename symbol across project

**Verification**:
1. Start LSP server for TypeScript
2. Test goto definition on function call
3. Test find references
4. Verify results are accurate

---

**Item 26: /pr Command (P1 - MEDIUM PRIORITY)**

**Problem**: No GitHub PR creation command. Claude has /pr for workflow integration.

**Root Cause**: Missing PR command implementation.

**Files**:
- floyd-wrapper-main/src/commands/pr.ts (NEW)
- floyd-wrapper-main/src/git/github-client.ts (NEW)

**Implementation**:
```typescript
// pr.ts
export async function createPR(options: {
  title: string;
  body?: string;
  branch?: string;
  base?: string;
}): Promise<PRResult> {
  const gh = new GitHubClient();
  const currentBranch = await gitCurrentBranch();

  const pr = await gh.createPullRequest({
    title: options.title,
    body: `${options.body || ''}\n\nCo-Authored-By: FLOYD <noreply@floyd.ai>`,
    head: options.branch || currentBranch,
    base: options.base || 'main'
  });

  // Open in browser for review
  await open(pr.html_url);

  return { url: pr.html_url, number: pr.number };
}
```

**CLI Usage**:
```bash
floyd pr "Fix authentication bug" --body "Resolves #123"
```

**Verification**:
1. Create test branch
2. Run floyd pr command
3. Verify PR created on GitHub
4. Verify Co-Authored-By footer present

---

**Item 27: Enhanced /permissions Command (P2 - MEDIUM PRIORITY)**

**Problem**: Basic permissions exist but no full management UI. Claude has rich /permissions command.

**Root Cause**: Incomplete permission CLI.

**Files**:
- floyd-wrapper-main/src/commands/permissions.ts (MODIFY)
- INK/floyd-cli/src/permissions/permission-cli.tsx (NEW)

**Implementation**:
```typescript
// permissions.ts
export const permissionsCommand = {
  description: 'Manage permission rules',
  subcommands: {
    '': 'Show all permission rules',
    'add <rule>': 'Add new permission rule',
    'remove <rule>': 'Remove permission rule',
    'test <tool>': 'Test what permission would apply',
    'mode <auto|ask|yolo>': 'Set permission mode',
    'list': 'List all rules with scopes'
  }
};

export async function showPermissions(): Promise<PermissionSummary> {
  return {
    mode: getCurrentMode(),
    rules: listRules(),
    stats: {
      total: countRules(),
      autoApproved: countAutoApproved(),
      askRequired: countAskRequired()
    }
  };
}

export async function testPermission(toolName: string, args: unknown): PermissionResult {
  const tool = getToolDefinition(toolName);
  const result = await checkPermission(tool, args);
  return {
    tool: toolName,
    allowed: result.allowed,
    rule: result.matchedRule,
    reason: result.reason
  };
}
```

**Enhanced Wildcards**:
```typescript
// Support Claude-style patterns
const PATTERNS = {
  'Bash(npm *)': (args) => args.command?.startsWith('npm '),
  'Bash(git * main)': (args) => args.command?.includes(' main'),
  'Read(*.ts)': (args) => args.file_path?.endsWith('.ts'),
  'Grep(src/**/*.ts)': (args) => args.path?.startsWith('src/'),
};
```

**Verification**:
1. Test /permissions displays all rules
2. Test /permissions add with wildcard pattern
3. Test /permissions test with various tools
4. Verify patterns match correctly

---

**Item 28: Thinking Mode Toggle (P2 - MEDIUM PRIORITY)**

**Problem**: No quick toggle for extended reasoning mode. Claude has Alt+T for thinking mode.

**Root Cause**: Thinking mode requires prompt modification, no UI toggle.

**Files**:
- INK/floyd-cli/src/prompts/thinking-prompt.ts (NEW)
- INK/floyd-cli/src/ui/input/shortcuts.ts (MODIFY)

**Implementation**:
```typescript
// thinking-prompt.ts
export function withThinkingMode(basePrompt: string): string {
  return `${basePrompt}

**THINKING MODE ENABLED**
Before each action, think step-by-step:
1. What do I want to accomplish?
2. What tools do I need?
3. What are the potential risks?
4. How will I verify success?

Show your reasoning for complex decisions.
`;
}

// shortcuts.ts - Add Alt+T handler
useInput((input, key) => {
  if (key.alt && key.name === 't') {
    toggleThinkingMode();
    renderStatus(`Thinking mode: ${thinkingMode ? 'ON' : 'OFF'}`);
  }
});
```

**Verification**:
1. Press Alt+T in CLI
2. Verify status updates
3. Test agent behavior with thinking on/off
4. Verify reasoning appears in output

---

**Item 29: Ctrl+G External Editor (P2 - MEDIUM PRIORITY)**

**Problem**: No way to edit input in external editor. Claude has Ctrl+G for $EDITOR.

**Root Cause**: Missing editor integration.

**Files**:
- INK/floyd-cli/src/ui/components/Input.tsx (MODIFY)

**Implementation**:
```typescript
// Input.tsx
useInput((input, key) => {
  if (key.ctrlG) {
    const editor = process.env.EDITOR || 'vim';
    const tmpFile = `/tmp/floyd-input-${Date.now()}.txt`;
    fs.writeFileSync(tmpFile, input);

    try {
      spawnSync(editor, [tmpFile], { stdio: 'inherit' });
      const edited = fs.readFileSync(tmpFile, 'utf-8');
      setInput(edited);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  }
});
```

**Verification**:
1. Type some text, press Ctrl+G
2. Verify editor opens with text
3. Edit and save
4. Verify CLI input updated

---

**Item 30: /context Command (P2 - MEDIUM PRIORITY)**

**Problem**: No visibility into token usage and context composition. Claude has /context breakdown.

**Root Cause**: Missing context tracking and reporting.

**Files**:
- floyd-wrapper-main/src/commands/context.ts (NEW)
- floyd-wrapper-main/src/utils/context-tracker.ts (NEW)

**Implementation**:
```typescript
// context-tracker.ts
export interface ContextBreakdown {
  total_tokens: number;
  max_tokens: number;
  used_percentage: number;
  breakdown: {
    system_prompt: number;
    conversation: number;
    tools: number;
    files: number;
    mcp_servers: number;
  };
  suggestions: string[];
}

export function getContextBreakdown(): ContextBreakdown {
  const systemPrompt = countTokens(currentSystemPrompt());
  const conversation = countTokens(messages.map(m => m.content));
  const tools = countTokens(JSON.stringify(enabledTools));
  const files = countTokens(includedFiles.map(f => f.content));
  const mcp = countTokens(mcpServerContexts);

  const total = systemPrompt + conversation + tools + files + mcp;
  const max = getMaxTokens();
  const percentage = (total / max) * 100;

  return {
    total_tokens: total,
    max_tokens: max,
    used_percentage: percentage,
    breakdown: {
      system_prompt: systemPrompt,
      conversation,
      tools,
      files,
      mcp_servers: mcp
    },
    suggestions: generateSuggestions(percentage)
  };
}

function generateSuggestions(percentage: number): string[] {
  const suggestions = [];
  if (percentage > 80) {
    suggestions.push('Compact conversation to free up context');
    suggestions.push('Unload unused MCP servers');
  }
  if (percentage > 90) {
    suggestions.push('Consider starting a new session');
  }
  return suggestions;
}
```

**CLI Output**:
```
CONTEXT BREAKDOWN
=================
Total: 45,000 / 200,000 tokens (22.5%)

Breakdown:
  System prompt:    1,200 tokens (0.6%)
  Conversation:    28,000 tokens (14.0%)
  Tools:            5,000 tokens (2.5%)
  Files:            8,000 tokens (4.0%)
  MCP servers:      3,000 tokens (1.5%)

Suggestions:
  ✅ Context is healthy
```

**Verification**:
1. Run /context with empty session
2. Add messages, run again
3. Include files, verify breakdown updates
4. Test suggestions appear at threshold

---

**Item 31: NotebookEdit Tool (P3 - LOW PRIORITY)**

**Problem**: No Jupyter notebook support. Claude has NotebookEdit tool.

**Root Cause**: Missing notebook format handling.

**Files**:
- floyd-wrapper-main/src/tools/notebook/notebook-tools.ts (NEW)

**Implementation**:
```typescript
// notebook-tools.ts
export async function readNotebook(filePath: string): Promise<Notebook> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function notebookEdit(
  notebookPath: string,
  cellId: string,
  newSource: string
): Promise<void> {
  const notebook = await readNotebook(notebookPath);
  const cell = notebook.cells.find(c => c.id === cellId);
  if (!cell) throw new Error(`Cell ${cellId} not found`);

  cell.source = newSource;
  cell.execution_count = null;
  cell.outputs = [];

  await fs.writeFile(notebookPath, JSON.stringify(notebook, null, 2));
}

export async function notebookInsertCell(
  notebookPath: string,
  afterCellId: string | null,
  cellType: 'code' | 'markdown',
  source: string
): Promise<string> {
  const notebook = await readNotebook(notebookPath);
  const newCell = {
    id: generateCellId(),
    cell_type: cellType,
    source,
    execution_count: null,
    outputs: []
  };

  if (afterCellId) {
    const index = notebook.cells.findIndex(c => c.id === afterCellId);
    notebook.cells.splice(index + 1, 0, newCell);
  } else {
    notebook.cells.push(newCell);
  }

  await fs.writeFile(notebookPath, JSON.stringify(notebook, null, 2));
  return newCell.id;
}
```

**Verification**:
1. Create test .ipynb file
2. Read and verify cells
3. Edit cell content
4. Insert new cell

---

**Item 32: Vim Mode Enhancement (P3 - LOW PRIORITY)**

**Problem**: Limited Vim keybindings. Claude has full vi mode.

**Root Cause**: Incomplete Vim motion implementation.

**Files**:
- INK/floyd-cli/src/ui/vim/vim-mode.ts (NEW)
- INK/floyd-cli/src/ui/components/Input.tsx (MODIFY)

**Implementation**:
```typescript
// vim-mode.ts
export const VIM_MOTIONS = {
  // Navigation
  'w': 'forwardWord',
  'b': 'backwardWord',
  'e': 'endOfWord',
  '0': 'startOfLine',
  '$': 'endOfLine',
  'gg': 'startOfDocument',
  'G': 'endOfDocument',

  // Editing
  'dd': 'deleteLine',
  'yy': 'copyLine',
  'p': 'paste',
  'u': 'undo',
  'ctrl+r': 'redo',

  // Visual mode
  'v': 'enterVisualMode',
  'V': 'enterVisualLineMode',

  // Search
  '/': 'searchForward',
  '?': 'searchBackward',
  'n': 'nextMatch',
  'N': 'previousMatch'
};

export class VimMode {
  private mode: 'normal' | 'insert' | 'visual' = 'insert';
  private pendingCommand: string[] = [];

  handleKey(key: Key): VimAction | null {
    // Implement Vim state machine
  }
}
```

**Verification**:
1. Enter Vim mode with Esc
2. Test motions (w, b, e, 0, $)
3. Test editing (dd, yy, p)
4. Test visual mode

---

**Item 33: Ctrl+R History Search (P3 - LOW PRIORITY)**

**Problem**: No command history search. Claude has Ctrl+R for interactive search.

**Root Cause**: Missing history search UI.

**Files**:
- INK/floyd-cli/src/ui/history/history-search.tsx (NEW)

**Implementation**:
```typescript
// history-search.tsx
export function HistorySearch() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<string[]>([]);

  useEffect(() => {
    if (query) {
      const history = getCommandHistory();
      const filtered = history.filter(cmd =>
        cmd.toLowerCase().includes(query.toLowerCase())
      );
      setMatches(filtered);
    }
  }, [query]);

  return (
    <Box flexDirection="column">
      <Text color="cyan">(reverse-i-search)`{query}': </Text>
      {matches.slice(0, 5).map((match, i) => (
        <Text key={i}>  {match}</Text>
      ))}
    </Box>
  );
}
```

**Verification**:
1. Execute some commands
2. Press Ctrl+R
3. Type search query
4. Select match, verify fills input

---

**Item 34: Session Folders (P3 - LOW PRIORITY)**

**Problem**: No organization of sessions by project/folder. Claude supports session folders.

**Root Cause**: Flat session storage.

**Files**:
- floyd-wrapper-main/src/sessions/session-folder.ts (NEW)
- floyd-wrapper-main/src/sessions/session-manager.ts (MODIFY)

**Implementation**:
```typescript
// session-folder.ts
export class SessionFolder {
  constructor(private basePath: string) {}

  async createFolder(name: string): Promise<void> {
    const path = join(this.basePath, name);
    await fs.mkdir(path, { recursive: true });
  }

  async listSessions(folder?: string): Promise<SessionInfo[]> {
    const searchPath = folder ? join(this.basePath, folder) : this.basePath;
    const entries = await fs.readdir(searchPath);
    return entries.filter(e => e.endsWith('.json')).map(parseSessionInfo);
  }

  async moveSession(sessionId: string, folder: string): Promise<void> {
    const current = this.getSessionPath(sessionId);
    const target = join(this.basePath, folder, `${sessionId}.json`);
    await fs.rename(current, target);
  }
}
```

**Verification**:
1. Create session folder
2. Save session to folder
3. List sessions in folder
4. Move session between folders

---

**Item 35: MCP Resource Mentions (P3 - LOW PRIORITY)**

**Problem**: No @resource:// syntax for MCP resources. Claude supports resource mentions.

**Root Cause**: Missing resource mention parsing.

**Files**:
- FloydDesktopWeb/server/mcp-client.ts (MODIFY)
- FloydDesktopWeb/server/mcp/resource-parser.ts (NEW)

**Implementation**:
```typescript
// resource-parser.ts
const RESOURCE_PATTERN = /@(\w+):\/\/([^\s]+)/;

export interface ResourceMention {
  protocol: string;    // github, postgres, gdrive, etc.
  path: string;
  original: string;
}

export function parseResourceMentions(text: string): ResourceMention[] {
  const matches = text.matchAll(new RegExp(RESOURCE_PATTERN, 'g'));
  return Array.from(matches).map(m => ({
    protocol: m[1],
    path: m[2],
    original: m[0]
  }));
}

export async function resolveResource(
  mention: ResourceMention,
  mcpClient: MCPClient
): Promise<string> {
  const server = mcpClient.getServerForProtocol(mention.protocol);
  if (!server) {
    throw new Error(`No MCP server for protocol: ${mention.protocol}`);
  }

  const resource = await server.getResource(mention.path);
  return resource.contents;
}
```

**Usage Examples**:
```
@github://anthropic/claude-code/issues/123
@postgres://query/SELECT * FROM users
@gdrive://document/1ABC...
```

**Verification**:
1. Configure GitHub MCP server
2. Use @github:// mention in message
3. Verify resource content included
4. Test error handling for missing servers

---
**PHASE 5 EXECUTION SUMMARY**

**Priority Breakdown**:
| Priority | Items | Time | Risk |
|----------|-------|------|------|
| P0 (Critical) | 22-24 | 5 days | Medium |
| P1 (High) | 25-26 | 2 days | Low |
| P2 (Medium) | 27-30 | 2 days | Low |
| P3 (Low) | 31-35 | 1-2 days | Low |

**Dependencies**:
- Item 23 (Agent Frontmatter) depends on hooks infrastructure (Item 22)
- Item 24 (/plan) benefits from Agent Frontmatter but can work standalone
- Item 27 (Enhanced /permissions) builds on Phase 0 Item A (Unified Permissions)

**GLM-Specific Considerations**:
1. **Model Selection for /plan**: Use glm-4-flash for faster planning (like Claude uses Haiku)
2. **Hooks with GLM**: Ensure hook payloads are compatible with OpenAI-format streaming
3. **LSP Integration**: GLM doesn't affect LSP - standard protocol works
4. **Resource Mentions**: Works with any MCP server regardless of LLM backend

**Preserve FLOYD Advantages**:
- SUPERCACHE 3-tier memory (no changes)
- Sandbox + Checkpoint/Rewind (no changes)
- Impact Simulation (no changes)
- Safe Refactor (no changes)

---
**RELATED DOCUMENTATION**

| Document | Location | Purpose |
|----------|----------|---------|
| Claude Platform Features | /CLAUDE_PLATFORMS_FEATURES.md | Claude system reference |
| Alignment Analysis | /docs/alignment.md | Claude vs FLOYD gap analysis |
| P0 Critical Bugs | /.floyd/P0_CRITICAL_BUGS.md | Bug tracker with fixes |
| P0 Implementation Plan | /.floyd/P0_IMPLEMENTATION_PLAN.md | Phased execution roadmap |
| Agent Structure Reference | /FLOYD ECOSYSTEM/FLOYD CODER AGENT WRAPPER/AGENT STRUCTURE AND SCAFFOLD/ | Agent scaffolding research |

---
**CHANGE LOG**

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Initial plan: 27 items across 4 phases | Douglas Talley |
| 2026-01-29 | Added Phase 5: Claude Alignment (14 items) | claude-opus-4-5 |

---  
