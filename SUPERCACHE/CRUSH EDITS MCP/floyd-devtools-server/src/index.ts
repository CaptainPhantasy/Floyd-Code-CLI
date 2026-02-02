/**
 * Floyd DevTools MCP Server
 *
 * Implements 6 development tools:
 *
 * Code Analysis:
 * 1. dependency_analyzer - Detect circular dependencies using Tarjan's SCC
 *
 * Schema & Migration:
 * 2. schema_migrator - Config/state migrations with versioning
 *
 * Performance:
 * 3. benchmark_runner - Performance tracking with statistical analysis
 *
 * Security:
 * 4. secure_hook_executor - Sandboxed hook execution with safety checks
 *
 * API Compatibility:
 * 5. api_format_verifier - LLM API format validation (OpenAI, Anthropic, Google)
 *
 * Testing:
 * 6. test_generator - Auto-generate test cases from code
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool handlers
import { dependencyAnalyzerDefinition, handleDependencyAnalyzer } from "./tools/dependency-analyzer.js";
import { schemaMigratorDefinition, handleSchemaMigrator } from "./tools/schema-migrator.js";
import { benchmarkRunnerDefinition, handleBenchmarkRunner } from "./tools/benchmark-runner.js";
import { secureHookExecutorDefinition, handleSecureHookExecutor } from "./tools/secure-hook-executor.js";
import { apiFormatVerifierDefinition, handleApiFormatVerifier } from "./tools/api-format-verifier.js";
import { testGeneratorDefinition, handleTestGenerator } from "./tools/test-generator.js";

// Create MCP server
const server = new Server(
  {
    name: "floyd-devtools-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all 6 tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Code Analysis
      dependencyAnalyzerDefinition,

      // Schema & Migration
      schemaMigratorDefinition,

      // Performance
      benchmarkRunnerDefinition,

      // Security
      secureHookExecutorDefinition,

      // API Compatibility
      apiFormatVerifierDefinition,

      // Testing
      testGeneratorDefinition,
    ],
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Code Analysis
      case "dependency_analyzer":
        return await handleDependencyAnalyzer(args);

      // Schema & Migration
      case "schema_migrator":
        return await handleSchemaMigrator(args);

      // Performance
      case "benchmark_runner":
        return await handleBenchmarkRunner(args);

      // Security
      case "secure_hook_executor":
        return await handleSecureHookExecutor(args);

      // API Compatibility
      case "api_format_verifier":
        return await handleApiFormatVerifier(args);

      // Testing
      case "test_generator":
        return await handleTestGenerator(args);

      default:
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Unknown tool",
              tool: name,
              available_tools: [
                "dependency_analyzer",
                "schema_migrator",
                "benchmark_runner",
                "secure_hook_executor",
                "api_format_verifier",
                "test_generator"
              ]
            }, null, 2)
          }],
          isError: true
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error handling tool call for ${name}:`, errorMessage);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "Internal server error",
          tool: name,
          message: errorMessage
        }, null, 2)
      }],
      isError: true
    };
  }
});

/**
 * Main entry point - server runs on stdio
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Floyd DevTools MCP server running on stdio");
  console.error("Available tools (6):");
  console.error("  Code Analysis:");
  console.error("    - dependency_analyzer");
  console.error("  Schema & Migration:");
  console.error("    - schema_migrator");
  console.error("  Performance:");
  console.error("    - benchmark_runner");
  console.error("  Security:");
  console.error("    - secure_hook_executor");
  console.error("  API Compatibility:");
  console.error("    - api_format_verifier");
  console.error("  Testing:");
  console.error("    - test_generator");
}

// Start the server
main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
