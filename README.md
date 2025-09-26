# n8n Playwright MCP Server

A Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright for n8n workflows.

## Features

- **Browser Navigation**: Navigate to URLs with support for Chromium, Firefox, and WebKit
- **Content Extraction**: Extract text content from entire pages or specific CSS selectors
- **Screenshot Capture**: Take full-page or element-specific screenshots
- **Session Management**: Persistent browser sessions for multi-step workflows
- **Multiple Browser Support**: Chromium, Firefox, and WebKit browsers

## Tools Available

### Core Browser Tools

#### 1. `browser_navigate`
Navigate to a URL using Playwright browser automation.

**Parameters:**
- `url` (required): The URL to navigate to
- `browserType` (optional): Browser type ('chromium', 'firefox', 'webkit'). Default: 'chromium'
- `sessionId` (optional): Session ID to reuse browser instance
- `waitForLoad` (optional): Wait for page load completion. Default: true
- `timeout` (optional): Navigation timeout in milliseconds. Default: 30000

#### 2. `get_page_content`
Extract text content from the current page or specific elements.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (optional): CSS selector for specific elements
- `contentType` (optional): Type of content ('text', 'html', 'innerText'). Default: 'text'
- `multiple` (optional): Extract from multiple elements. Default: false

#### 3. `take_screenshot`
Capture screenshots of entire pages or specific elements and save to file for MCP tool processing.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (optional): CSS selector for specific element
- `format` (optional): Image format ('png', 'jpeg'). Default: 'png'
- `quality` (optional): Image quality for JPEG (0-100). Default: 80
- `fullPage` (optional): Capture full scrollable page. Default: true
- `tempDir` (optional): Directory to save temporary screenshots. Default: './temp-screenshots'

**Response:**
- Returns `filePath` (absolute path to saved file) instead of base64 data
- Includes `isTemporary: true` flag for temporary files
- Automatically generates unique filenames with timestamp and session ID

#### 4. `browser_close`
Close browser sessions and cleanup resources.

**Parameters:**
- `sessionId` (optional): Session ID to close
- `closeType` (optional): What to close ('session', 'page', 'all'). Default: 'session'

#### 5. `browser_session_info`
Get information about active browser sessions.

### QA and Analysis Tools

#### 6. `find_selector_by_text`
Find CSS selectors for elements containing specific text content.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `text` (required): Text content to search for
- `exactMatch` (optional): Whether to match exact text or partial text. Default: false
- `includeParents` (optional): Include parent element selectors. Default: true
- `maxResults` (optional): Maximum number of results to return. Default: 10

**Use Case:** Perfect for locating elements by their text content for further analysis or interaction.

#### 7. `analyze_page_sections`
Break down the page into logical sections for visual analysis and QA testing.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `sectionTypes` (optional): Types of analysis ('semantic', 'visual', 'layout'). Default: ['semantic', 'visual']
- `minSectionSize` (optional): Minimum size in pixels for a section. Default: 100
- `includeHidden` (optional): Include hidden elements. Default: false

**Use Case:** Identifies semantic sections (header, nav, main), visual components (cards, banners), and layout containers for systematic QA testing.

#### 8. `capture_section_screenshots`
Capture screenshots of specific page sections for visual analysis.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `sectionSelectors` (optional): Array of CSS selectors for sections to capture
- `outputDir` (optional): Directory to save screenshots. Default: './screenshots'
- `format` (optional): Image format ('png', 'jpeg'). Default: 'png'
- `quality` (optional): Image quality for JPEG (0-100). Default: 80
- `addBorder` (optional): Add visual border around sections. Default: true
- `includeMetadata` (optional): Include element metadata. Default: true

**Use Case:** Automatically captures visual screenshots of each page section with metadata for comprehensive visual QA analysis.

**Response:**
- Returns `filePath` (absolute path to saved file) for each screenshot instead of base64 data
- Includes `isTemporary: false` flag for persistent files
- Automatically generates unique filenames with timestamp and section info

#### 9. `analyze_page_qa`
Perform comprehensive QA analysis including accessibility, performance, SEO, and structural issues.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `checkAccessibility` (optional): Check for accessibility issues. Default: true
- `checkPerformance` (optional): Check for performance issues. Default: true
- `checkSEO` (optional): Check for SEO issues. Default: true
- `checkStructure` (optional): Check for structural issues. Default: true
- `includeElementCounts` (optional): Include counts of different elements. Default: true

**Use Case:** Provides comprehensive QA scores and detailed issue analysis covering:
- **Accessibility**: Alt text, labels, heading hierarchy, ARIA attributes
- **Performance**: Large images, inline styles, external resources
- **SEO**: Meta tags, title length, canonical links, structured data
- **Structure**: Semantic elements, proper nesting, deprecated tags

### Enhanced QA and Interaction Tools

#### 10. `click_element`
Click elements on the page for interaction testing.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (required): CSS selector of the element to click
- `button` (optional): Mouse button to use ('left', 'right', 'middle'). Default: 'left'
- `timeout` (optional): Timeout in milliseconds to wait for element. Default: 30000
- `waitForResponse` (optional): Wait for network responses after clicking. Default: true
- `modifiers` (optional): Modifier keys to hold during click (['Alt', 'Control', 'Meta', 'Shift'])

**Use Case:** Test button clicks, link navigation, form submissions, and interactive elements.

#### 11. `fill_form_field`
Fill form inputs for comprehensive form testing and validation.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (required): CSS selector of the form field to fill
- `value` (required): Value to enter into the form field
- `inputType` (optional): Type of input field ('text', 'select', 'radio', 'checkbox', 'file'). Default: 'text'
- `clearFirst` (optional): Clear the field before filling. Default: true
- `timeout` (optional): Timeout in milliseconds to wait for element. Default: 30000
- `triggerEvents` (optional): Trigger input and change events after filling. Default: true

**Use Case:** Test form functionality, input validation, different field types, and form submission workflows.

#### 12. `wait_for_element`
Wait for elements to appear, disappear, or change state for dynamic content testing.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (required): CSS selector of the element to wait for
- `state` (optional): State to wait for ('visible', 'hidden', 'attached', 'detached'). Default: 'visible'
- `timeout` (optional): Timeout in milliseconds to wait for element. Default: 30000
- `checkInterval` (optional): Interval in milliseconds to check element state. Default: 100
- `returnElementInfo` (optional): Return detailed element information when found. Default: true

**Use Case:** Test single-page applications, AJAX content loading, dynamic UI changes, and progressive enhancement.

#### 13. `get_page_metrics`
Extract comprehensive performance timing data and metrics from the current page.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `includeNavigation` (optional): Include navigation timing data. Default: true
- `includeResources` (optional): Include resource timing data. Default: true
- `includePaint` (optional): Include paint timing data. Default: true
- `includeMemory` (optional): Include memory usage data (if available). Default: false
- `includeLayoutShift` (optional): Include cumulative layout shift data. Default: true

**Use Case:** Performance analysis covering navigation timing, resource loading, paint metrics, core web vitals, and memory usage.

#### 14. `check_broken_links`
Validate all links on the page and identify broken or problematic links.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `includeExternal` (optional): Include external links in the check. Default: true
- `includeInternal` (optional): Include internal links in the check. Default: true
- `timeout` (optional): Timeout in milliseconds for each link check. Default: 10000
- `maxConcurrent` (optional): Maximum number of concurrent link checks. Default: 5
- `followRedirects` (optional): Follow redirects when checking links. Default: true
- `checkAnchors` (optional): Check anchor links (hash fragments). Default: false

**Use Case:** Link validation, SEO auditing, broken link detection, and redirect analysis with health scoring.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Usage

The server runs on port 3000 by default. Send MCP requests to `http://localhost:3000/mcp`.

### Example MCP Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "browser_navigate",
    "arguments": {
      "url": "https://example.com",
      "browserType": "chromium",
      "sessionId": "my-session"
    }
  }
}
```

## Session Management

Browser sessions are persistent and identified by `sessionId`. If no `sessionId` is provided, a default session is used. This allows for multi-step browser automation workflows:

1. Navigate to a page
2. Extract content from specific elements
3. Take screenshots
4. Navigate to another page in the same session
5. Close the session when done

## Error Handling

All tools return structured JSON responses with a `success` field indicating whether the operation completed successfully. Error details are provided in the `error` field when `success` is false.