import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { getSession } from '../utils/browserUtils.js';

const schema = z.object({
  sessionId: z.string().optional().describe('Session ID of the browser instance'),
  code: z.string().min(1).describe(
    'Async JavaScript code body to run with access to page, context, browser, params, console. Example: await page.click("a"); return await page.title();'
  ),
  timeoutMs: z.number().int().min(1).max(120000).optional().describe('Execution timeout in milliseconds (default 15000)')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { sessionId, code } = params;
    const timeoutMs = params.timeoutMs ?? 15000;
    const sessionKey = sessionId || 'default';
    const session = getSession(sessionKey, context.browserSessions);

    if (!session) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }

    const logs: Array<{ level: 'log' | 'info' | 'warn' | 'error'; message: string }> = [];
    const captureConsole = {
      log: (...args: any[]) => logs.push({ level: 'log', message: args.map(safeToString).join(' ') }),
      info: (...args: any[]) => logs.push({ level: 'info', message: args.map(safeToString).join(' ') }),
      warn: (...args: any[]) => logs.push({ level: 'warn', message: args.map(safeToString).join(' ') }),
      error: (...args: any[]) => logs.push({ level: 'error', message: args.map(safeToString).join(' ') })
    };

    const asyncWrapperSource = `return (async () => {\n${code}\n})();`;

    let returnValue: any;
    const startTime = Date.now();
    try {
      // Construct a function with scoped parameters and run with timeout guard
      const userFunction = new Function('page', 'context', 'browser', 'params', 'console', asyncWrapperSource) as (
        page: any,
        context: any,
        browser: any,
        params: any,
        consoleObj: any
      ) => Promise<any>;

      const execution = userFunction(session.page, session.context, session.browser, params, captureConsole);
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Execution timed out')), timeoutMs));
      returnValue = await Promise.race([execution, timeout]);
    } catch (e) {
      return createErrorResponse(e instanceof Error ? e.message : 'Unknown error while executing code');
    }
    const durationMs = Date.now() - startTime;

    let serializedReturn: any;
    try {
      serializedReturn = JSON.parse(JSON.stringify(returnValue));
    } catch {
      serializedReturn = safeToString(returnValue);
    }

    const pageTitle = await session.page.title().catch(() => undefined);
    const currentUrl = (() => { try { return session.page.url(); } catch { return undefined; } })();

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url: currentUrl,
      title: pageTitle,
      durationMs,
      logs,
      returnValue: serializedReturn,
      message: 'Playwright code executed successfully'
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during Playwright code execution');
  }
}

function safeToString(value: any): string {
  try {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
    const json = JSON.stringify(value);
    return json ?? Object.prototype.toString.call(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export const runPlaywright: ToolDefinition = {
  name: 'run_playwright',
  description: 'Execute custom async Playwright code using the active session (page, context, browser available)',
  inputSchema: schema,
  handler
};
