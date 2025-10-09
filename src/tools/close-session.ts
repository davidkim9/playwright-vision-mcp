import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';
import { createErrorResponse, createSuccessResponse } from '../utils/responseUtils.js';

const schema = z.object({});

async function handler(_: z.infer<typeof schema>, context: ToolContext) {
  try {
    // Close all sessions (server-managed)
    const sessionIds = Array.from(context.browserSessions.keys());
    const results: Array<{ sessionId: string; status: 'closed' | 'error'; error?: string }> = [];

    for (const sessionKey of sessionIds) {
      const session = context.browserSessions.get(sessionKey);
      if (session) {
        try {
          await session.browser.close();
          context.browserSessions.delete(sessionKey);
          results.push({ sessionId: sessionKey, status: 'closed' });
        } catch (error) {
          results.push({
            sessionId: sessionKey,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return createSuccessResponse({
      success: true,
      closedSessions: results.filter(r => r.status === 'closed').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
      message: `Closed ${results.filter(r => r.status === 'closed').length} browser sessions`
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during session close');
  }
}

export const closeSession: ToolDefinition = {
  name: 'close_session',
  description: 'Close all browser sessions managed by the server and clear current session',
  inputSchema: schema,
  handler
};