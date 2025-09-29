import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { getOrCreateSession, getBrowserType } from '../utils/browserUtils.js';

const schema = z.object({
  url: z.string().url().describe('The URL to navigate to'),
  sessionId: z.string().optional().describe('Session ID to reuse browser instance')
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  try {
    const { url, sessionId } = params;
    // Sensible defaults kept internally to maintain functionality
    const browserType = getBrowserType();
    const waitForLoad = true;
    const timeout = 30000;
    const sectionTypes: Array<'semantic' | 'visual' | 'layout'> = ['semantic', 'visual'];
    const minSectionSize = 100;
    const includeHidden = false;
    const maxSections = 15;
    const verbose = false;
    const sessionKey = sessionId || 'default';

    // Get or create browser session
    const session = await getOrCreateSession(sessionKey, browserType, context.browserSessions);

    const response = await session.page.goto(url, {
      waitUntil: waitForLoad ? 'networkidle' : 'domcontentloaded',
      timeout
    });

    const pageTitle = await session.page.title();

    // Extract sections and internal links
    const analysis = await session.page.evaluate(({ sectionTypes, minSectionSize, includeHidden }) => {
      const clean = (text: string | null | undefined) => {
        if (!text) return '';
        return text
          .replace(/\u00A0/g, ' ')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const sections: any[] = [];
      const internalLinks: any[] = [];

      // Extract internal links
      const currentDomain = window.location.hostname;
      const links = document.querySelectorAll('a[href]');
      links.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (!href) return;

        let fullUrl: string;
        try {
          if (href.startsWith('/')) {
            fullUrl = window.location.origin + href;
          } else if (href.startsWith('#')) {
            fullUrl = window.location.href.split('#')[0] + href;
          } else if (href.startsWith('http')) {
            const linkUrl = new URL(href);
            if (linkUrl.hostname !== currentDomain) return; // Skip external links
            fullUrl = href;
          } else {
            fullUrl = new URL(href, window.location.href).href;
            const linkUrl = new URL(fullUrl);
            if (linkUrl.hostname !== currentDomain) return; // Skip external links
          }

          const rect = link.getBoundingClientRect();
          internalLinks.push({
            text: clean(link.textContent) || '',
            href: fullUrl,
            isVisible: rect.width > 0 && rect.height > 0,
            // boundingBox: rect
          });
        } catch (e) {
          // Skip malformed URLs
        }
      });

      // Extract sections
      if (sectionTypes.includes('semantic')) {
        const semanticElements = [
          'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
          'form', 'fieldset', 'table', 'figure', 'blockquote'
        ];

        semanticElements.forEach(tagName => {
          const elements = document.querySelectorAll(tagName);
          elements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (!includeHidden && (rect.width === 0 || rect.height === 0)) return;
            if (rect.width * rect.height < minSectionSize) return;

            sections.push({
              id: `semantic-${tagName}-${sections.length}`,
              type: 'semantic',
              tagName,
              selector: `${tagName}:nth-of-type(${index + 1})`,
              // boundingBox: rect,
              area: rect.width * rect.height,
              text: clean(element.textContent)?.substring(0, 100) || ''
            });
          });
        });
      }

      if (sectionTypes.includes('visual')) {
        const visualSelectors = [
          '.card', '.panel', '.box', '.container', '.wrapper',
          '.content', '.section', '.block', '.widget', '.component'
        ];

        visualSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (!includeHidden && (rect.width === 0 || rect.height === 0)) return;
            if (rect.width * rect.height < minSectionSize) return;

            sections.push({
              id: `visual-${selector.replace(/[^a-zA-Z0-9]/g, '-')}-${sections.length}`,
              type: 'visual',
              selector,
              // boundingBox: rect,
              area: rect.width * rect.height,
              text: clean(element.textContent)?.substring(0, 100) || ''
            });
          });
        });
      }

      if (sectionTypes.includes('layout')) {
        const layoutElements = document.querySelectorAll('div');
        layoutElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (!includeHidden && (rect.width === 0 || rect.height === 0)) return;
          if (rect.width * rect.height < minSectionSize * 4) return;

          const children = element.children.length;
          if (children >= 2) {
            sections.push({
              id: `layout-${element.tagName.toLowerCase()}-${sections.length}`,
              type: 'layout',
              tagName: 'div',
              // boundingBox: rect,
              area: rect.width * rect.height,
              childrenCount: children,
              text: clean(element.textContent)?.substring(0, 100) || ''
            });
          }
        });
      }

      return {
        sections: sections.sort((a, b) => b.area - a.area),
        internalLinks: internalLinks.filter(link => link.text.length > 0)
      };
    }, { sectionTypes, minSectionSize, includeHidden });

    const topSections = analysis.sections.slice(0, Math.max(0, verbose ? analysis.sections.length : maxSections)).map((s: any) => ({
      id: s.id,
      type: s.type,
      selector: s.selector,
      tagName: s.tagName,
      area: s.area,
      // // boundingBox: s.boundingBox,
      text: s.text
    }));

    const sectionsByType = {
      semantic: analysis.sections.filter((s: any) => s.type === 'semantic').length,
      visual: analysis.sections.filter((s: any) => s.type === 'visual').length,
      layout: analysis.sections.filter((s: any) => s.type === 'layout').length
    };

    return createSuccessResponse({
      success: true,
      sessionId: sessionKey,
      url,
      title: pageTitle,
      status: response?.status() || 'unknown',
      browserType,
      sections: topSections,
      internalLinks: analysis.internalLinks,
      summary: {
        totalSections: analysis.sections.length,
        sectionsByType,
        returnedSections: topSections.length,
        truncatedSections: !verbose && analysis.sections.length > topSections.length,
        totalInternalLinks: analysis.internalLinks.length,
        visibleLinks: analysis.internalLinks.filter((link: any) => link.isVisible).length
      },
      message: `Successfully navigated to ${url}. Analyzed ${analysis.sections.length} sections and found ${analysis.internalLinks.length} internal links.`
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred during navigation and analysis');
  }
}

export const navigateAnalyze: ToolDefinition = {
  name: 'navigate_url',
  description: 'Navigate to a URL and automatically analyze page sections and extract internal links',
  inputSchema: schema,
  handler
};