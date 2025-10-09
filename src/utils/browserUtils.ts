import { Browser, chromium, firefox, webkit } from 'playwright';

import type { BrowserSession, BrowserSessions } from '../shared/types.js';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

/**
 * Get or create a browser session
 */
export async function getOrCreateSession(
  sessionKey: string,
  browserType: BrowserType,
  browserSessions: BrowserSessions
): Promise<BrowserSession> {
  let session = browserSessions.get(sessionKey);

  // Check if session exists and has the correct browser type
  if (!session || session.browserType !== browserType) {
    if (session) {
      await session.browser.close();
    }

    const browser = await launchBrowser(browserType);
    const context = await browser.newContext();
    const page = await context.newPage();

    session = {
      browser,
      context,
      page,
      browserType
    };

    browserSessions.set(sessionKey, session);
  }

  return session;
}

/**
 * Get an existing browser session
 */
export function getSession(
  sessionKey: string,
  browserSessions: BrowserSessions
): BrowserSession | undefined {
  return browserSessions.get(sessionKey);
}

/**
 * Generate a URL-safe session ID
 */
export function generateSessionId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `sess_${time}_${random}`;
}

/**
 * Launch a browser based on type
 */
export async function launchBrowser(browserType: BrowserType): Promise<Browser> {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

  let browserLauncher;
  if (browserType === 'firefox') {
    browserLauncher = firefox;
  } else if (browserType === 'webkit') {
    browserLauncher = webkit;
  } else {
    browserLauncher = chromium;
  }

  return await browserLauncher.launch({ headless });
}

/**
 * Get browser type from environment variable
 */
export function getBrowserType(): BrowserType {
  const envBrowserType = process.env.BROWSER_TYPE || 'chromium';

  if (envBrowserType === 'firefox' || envBrowserType === 'webkit') {
    return envBrowserType;
  }

  return 'chromium';
}