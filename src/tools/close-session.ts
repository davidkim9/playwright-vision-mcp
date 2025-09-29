import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { getSession } from '../utils/browserUtils.js';

const schema = z.object({
  sessionId: z.string().optional().describe('Session ID of the browser instance to close. If not provided, closes all sessions')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { sessionId } = params;

    if (sessionId) {
      const sessionKey = sessionId === 'default' ? 'default' : sessionId;
      const session = getSession(sessionKey, context.browserSessions);

      if (!session) {
        return createErrorResponse(`No browser session found with ID: ${sessionKey}`);
      }

      await session.browser.close();
      context.browserSessions.delete(sessionKey);

      return createSuccessResponse({
        success: true,
        sessionId: sessionKey,
        message: `Successfully closed browser session: ${sessionKey}`
      });
    } else {
      // Close all sessions
      const sessionIds = Array.from(context.browserSessions.keys());
      const results = [];

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
    }
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during session close');
  }
}

export const closeSession: ToolDefinition = {
  name: 'close_session',
  description: 'Close browser sessions to free up resources',
  inputSchema: schema,
  handler
};