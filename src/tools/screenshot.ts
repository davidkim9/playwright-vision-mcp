import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import path from 'path';
import { ensureDirectoryExists, generateScreenshotFilename } from '../utils/fileUtils.js';

const schema = z.object({
  sessionId: z.string().optional().describe('Session ID of the browser instance'),
  selector: z.string().optional().describe('CSS selector to screenshot specific element. Omit to capture full page')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { sessionId, selector } = params;
    // Defaults preserved internally
    const format = 'png' as const;
    const quality = 80 as const;
    const omitBackground = false;
    const fullPage = !selector;
    const sessionKey = sessionId || 'default';
    const session = context.browserSessions.get(sessionKey);

    if (!session) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }

    const targetSelector = selector;

    // Save into a per-session subdirectory under the project's screenshots directory
    const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    const sessionDir = path.join(screenshotsDir, sessionKey);
    ensureDirectoryExists(sessionDir);

    const selectorLabel = selector ? selector : fullPage ? 'full-page' : 'viewport';

    const filename = generateScreenshotFilename(sessionKey, selectorLabel, format);
    const outputPath = path.join(sessionDir, filename);

    const screenshotOptions: any = {
      fullPage,
      path: outputPath,
      quality: undefined,
      type: format,
      omitBackground
    };

    let screenshotBuffer: Buffer;
    let target: string;

    if (targetSelector) {
      const element = await session.page.$(targetSelector);
      if (!element) {
        return createErrorResponse(`Element not found with selector: ${targetSelector}`);
      }
      screenshotBuffer = await element.screenshot(screenshotOptions);
      target = `selector: ${targetSelector}`;
    } else {
      screenshotBuffer = await session.page.screenshot(screenshotOptions);
      target = fullPage ? 'full page' : 'viewport';
    }

    const pageTitle = await session.page.title();
    const currentUrl = session.page.url();

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url: currentUrl,
      title: pageTitle,
      target,
      format,
      size: screenshotBuffer.length,
      path: outputPath,
      message: `Successfully captured screenshot of ${target}`
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during screenshot');
  }
}

export const takeScreenshot: ToolDefinition = {
  name: 'take_screenshot',
  description: 'Take screenshots of the page or specific sections identified by navigate_url analysis',
  inputSchema: schema,
  handler
};