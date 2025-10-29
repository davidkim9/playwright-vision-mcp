import OpenAI from 'openai';
import path from 'path';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../shared/types.js';
import { getSession } from '../utils/browserUtils.js';
import { ensureDirectoryExists, generateScreenshotFilename } from '../utils/fileUtils.js';
import { createErrorResponse, createSuccessResponse } from '../utils/responseUtils.js';

const schema = z.object({
  prompt: z.string().min(1).describe('Instruction for analyzing the current viewport screenshot')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse('OPENAI_API_KEY not set. Vision tool unavailable.');
    }

    const { prompt } = params;

    const sessionKey = context.currentSessionId || null;
    if (!sessionKey) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }
    const session = getSession(sessionKey, context.browserSessions);
    if (!session) {
      return createErrorResponse('No active browser session found. Use navigate_url first.');
    }

    // Prepare local output path for the screenshot (viewport only)
    const screenshotsDir = process.env.SCREENSHOT_DIR || path.resolve(process.cwd(), 'screenshots');
    const sessionDir = path.join(screenshotsDir, sessionKey);
    ensureDirectoryExists(sessionDir);

    const format = 'png' as const;
    const filename = generateScreenshotFilename(sessionKey, 'viewport', format);
    const outputPath = path.join(sessionDir, filename);

    const screenshotBuffer: Buffer = await session.page.screenshot({
      fullPage: false,
      path: outputPath,
      type: format,
      omitBackground: false
    });

    // Always use base64 data URI for image input
    const base64DataUri = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
    const imageUrl = base64DataUri;

    // Call OpenAI Vision with the uploaded image URL
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    });


    const model = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    const aiText = completion.choices?.[0]?.message?.content ?? '';

    const pageTitle = await session.page.title();
    const currentUrl = session.page.url();

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url: currentUrl,
      title: pageTitle,
      // Do not include base64 data in the response to keep payloads small
      // The image is already sent to the OpenAI API above
      screenshot: undefined,
      openai: {
        model,
        prompt,
        response: aiText
      }
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error during image analysis');
  }
}

export const analyzeImage: ToolDefinition = {
  name: 'analyze_image',
  description: 'Capture viewport screenshot and analyze with OpenAI Vision',
  inputSchema: schema,
  handler
};
