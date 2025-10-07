#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { BrowserSessions, ToolContext } from './shared/types.js';
import { getAllTools } from './tools/registry.js';

// Global browser sessions storage
const browserSessions: BrowserSessions = new Map();

// Create tool context
const toolContext: ToolContext = {
  browserSessions
};

const getServer = () => {
  const server = new McpServer({
    name: 'n8n-playwright-mcp-server',
    version: '1.0.0',
  }, { capabilities: { logging: {} } });

  // Register all tools from the registry
  const tools = getAllTools();

  tools.forEach(toolDef => {
    server.tool(
      toolDef.name,
      toolDef.description,
      toolDef.inputSchema.shape,
      async (params: unknown) => {
        return await toolDef.handler(params, toolContext);
      }
    );
  });

  console.error(`✅ Registered ${tools.length} tools:`);
  tools.forEach(tool => {
    console.error(`   • ${tool.name}: ${tool.description}`);
  });

  return server;
};

// Main function to start the stdio server
async function main() {
  const server = getServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('🚀 n8n Playwright MCP Server running on stdio');

  // Handle server shutdown and cleanup
  const cleanup = async () => {
    console.error('\n🔄 Shutting down server...');

    // Close all browser sessions
    for (const [sessionId, session] of browserSessions.entries()) {
      try {
        await session.browser.close();
        console.error(`   ✅ Closed browser session: ${sessionId}`);
      } catch (error) {
        console.error(`   ❌ Error closing browser session ${sessionId}:`, error);
      }
    }

    browserSessions.clear();
    console.error('👋 Server shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});