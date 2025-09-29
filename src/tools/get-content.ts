import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse, sanitizeText } from '../utils/responseUtils.js';
import { getSession } from '../utils/browserUtils.js';

const schema = z.object({
  sessionId: z.string().optional().describe('Session ID of the browser instance'),
  selector: z.string().optional().describe('CSS selector to extract content. If omitted, extracts full page')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { sessionId, selector } = params;
    // Defaults preserved internally
    const contentType = 'text' as const;
    const previewLength = 500;
    const verbose = false;
    const sessionKey = sessionId || 'default';

    // Get existing browser session
    const session = getSession(sessionKey, context.browserSessions);

    if (!session) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }

    let content;
    let contentLength = 0;
    let truncated = false;
    const targetSelector = selector;

    if (targetSelector) {
      const element = await session.page.$(targetSelector);
      if (!element) {
        return createErrorResponse(`Element not found with selector: ${targetSelector}`);
      }

      content = await element.textContent();
      content = sanitizeText((content as string) || '');
      contentLength = (content as string).length;
      if (!verbose && typeof content === 'string' && content.length > previewLength) {
        content = (content as string).slice(0, previewLength);
        truncated = true;
      }
    } else {
      // Extract full page content
      content = await session.page.textContent('body');
      content = sanitizeText((content as string) || '');
      contentLength = (content as string).length;
      if (!verbose && typeof content === 'string' && content.length > previewLength) {
        content = (content as string).slice(0, previewLength);
        truncated = true;
      }
    }

    const pageTitle = await session.page.title();
    const currentUrl = session.page.url();

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url: currentUrl,
      title: pageTitle,
      selector: targetSelector || 'full page',
      contentType,
      content,
      contentLength: typeof content === 'string' ? contentLength : undefined,
      truncated: !verbose ? truncated : false,
      previewLength: !verbose ? previewLength : undefined,
      message: `Successfully extracted ${contentType} content`
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during content extraction');
  }
}

export const getContent: ToolDefinition = {
  name: 'get_content',
  description: 'Extract content from the page or specific sections identified by navigate_url analysis',
  inputSchema: schema,
  handler
};