import { Browser, BrowserContext, Page } from 'playwright';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  browserType: string;
}

export type BrowserSessions = Map<string, BrowserSession>;

export interface ToolFunction {
  (params: any, context: ToolContext): Promise<CallToolResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: ToolFunction;
}

export interface ToolContext {
  browserSessions: BrowserSessions;
}