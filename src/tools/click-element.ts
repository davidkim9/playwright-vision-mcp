import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { getSession } from '../utils/browserUtils.js';

const schema = z.object({
  sessionId: z.string().optional().describe('Session ID of the browser instance'),
  selector: z.string().describe('CSS selector of the element to click')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { sessionId, selector } = params;
    const sessionKey = sessionId || 'default';
    const session = getSession(sessionKey, context.browserSessions);

    if (!session) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }

    // Minimal behavior: click first matching element for selector
    const element = session.page.locator(selector).first();
    if (await element.count() === 0) {
      return createErrorResponse(`Element with selector "${selector}" not found`);
    }
    await element.click({ timeout: 10000, force: false });
    const clickResult = { method: 'selector', target: selector };

    const currentUrl = session.page.url();
    const pageTitle = await session.page.title();

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url: currentUrl,
      title: pageTitle,
      clickMethod: clickResult.method,
      target: clickResult.target,
      message: `Successfully clicked ${clickResult.method}: ${clickResult.target}`
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during click');
  }
}

export const clickElement: ToolDefinition = {
  name: 'click_element',
  description: 'Click on elements using various targeting methods including sections from navigate_url analysis',
  inputSchema: schema,
  handler
};