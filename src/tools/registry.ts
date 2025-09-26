import type { ToolDefinition } from '../shared/types.js';

// Simplified combined tools
import { navigateAnalyze } from './navigate-analyze.js';
import { clickElement } from './click-element.js';
import { getContent } from './get-content.js';
import { takeScreenshot } from './screenshot.js';
import { closeSession } from './close-session.js';
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
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  navigateAnalyze,
  clickElement,
  getContent,
  takeScreenshot,
  closeSession,
  runPlaywright
];

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