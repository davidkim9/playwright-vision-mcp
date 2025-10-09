import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import express, { Request, Response } from 'express';
import type { BrowserSessions, ToolContext } from './shared/types.js';
import { getAllTools } from './tools/registry.js';

// Global browser sessions storage
const browserSessions: BrowserSessions = new Map();

// Create tool context
const toolContext: ToolContext = {
  browserSessions,
  currentSessionId: null
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

  console.log(`✅ Registered ${tools.length} tools:`);
  tools.forEach(tool => {
    console.log(`   • ${tool.name}: ${tool.description}`);
  });

  return server;
};

const app = express();
app.use(express.json());

app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id']
}));

app.post('/mcp', async (req: Request, res: Response) => {
  const server = getServer();
  try {
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4201;
app.listen(PORT, (error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.log(`🚀 n8n Playwright MCP Server listening on port ${PORT}`);
});

// Handle server shutdown and cleanup
const cleanup = async () => {
  console.log('\\n🔄 Shutting down server...');

  // Close all browser sessions
  for (const [sessionId, session] of browserSessions.entries()) {
    try {
      await session.browser.close();
      console.log(`   ✅ Closed browser session: ${sessionId}`);
    } catch (error) {
      console.error(`   ❌ Error closing browser session ${sessionId}:`, error);
    }
  }

  browserSessions.clear();
  console.log('👋 Server shutdown complete');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);