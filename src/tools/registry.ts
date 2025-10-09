import type { ToolDefinition } from '../shared/types.js';
import { analyzeImage } from './analyze-image.js';
import { clickElement } from './click-element.js';
import { closeSession } from './close-session.js';
import { getContent } from './get-content.js';
import { navigateAnalyze } from './navigate-analyze.js';
import { runPlaywright } from './run-playwright.js';

/**
 * Simplified Tool Registry - Essential tools only
 *
 * This simplified toolkit combines functionality to reduce complexity:
 * - navigate_url: Navigation + section analysis + internal link extraction
 * - click_element: Unified clicking with support for sections
 * - get_content: Content extraction with section support
 * - take_screenshot: Screenshots with section support
 * - close_session: Session management
 */
const baseTools: ToolDefinition[] = [
  navigateAnalyze,
  clickElement,
  getContent,
  closeSession,
  runPlaywright
];

// Conditionally add OpenAI Vision tool when API key is present
export const AVAILABLE_TOOLS: ToolDefinition[] = (() => {
  const tools = [...baseTools];
  if (process.env.OPENAI_API_KEY) {
    tools.push(analyzeImage);
  }
  return tools;
})();

/**
 * Get all registered tools
 */
export function getAllTools(): ToolDefinition[] {
  return AVAILABLE_TOOLS;
}

/**
 * Get a specific tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return AVAILABLE_TOOLS.find(tool => tool.name === name);
}