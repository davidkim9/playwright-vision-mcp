# Available Tools

### 1. `navigate_url`
Navigate to a URL and automatically analyze page structure.

**Parameters:**
- `url` (required): The URL to navigate to
- `sessionId` (optional): Session ID to reuse browser instance (default: "default")

**Returns:**
- Page title, URL, and HTTP status
- Automatically identified page sections (semantic, visual, layout)
- Internal links found on the page
- Summary statistics

### 2. `get_content`
Extract text content from the page or specific elements.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (optional): CSS selector to extract content from

**Returns:**
- Extracted text content
- Content length and truncation info
- Page title and URL

### 3. `take_screenshot`
Capture screenshots of pages or specific elements.

**Parameters:**
- `sessionId` (optional): Session ID of the browser instance
- `selector` (optional): CSS selector to screenshot specific element

**Returns:**
- File path to saved screenshot
- Screenshot size and format
- Page title and URL
- Base64-encoded screenshot data (unless `DISABLE_SCREENSHOT_DATA` is set)

### 4. `click_element`
Click on elements using CSS selectors.

**Parameters:**
- `selector` (required): CSS selector of the element to click
- `sessionId` (optional): Session ID of the browser instance

**Returns:**
- Success status
- Current URL and page title after click

### 5. `close_session`
Close browser sessions to free up resources.

**Parameters:**
- `sessionId` (optional): Session ID to close. If omitted, closes all sessions

**Returns:**
- Number of closed sessions
- Session IDs that were closed

### 6. `run_playwright`
Execute custom async Playwright code with full access to the browser API.

**Parameters:**
- `code` (required): Async JavaScript code to execute
- `sessionId` (optional): Session ID of the browser instance
- `timeoutMs` (optional): Execution timeout in milliseconds (default: 15000, max: 120000)

**Returns:**
- Return value from executed code
- Execution duration
- Console logs captured during execution

**Example:**
```javascript
const title = await page.title();
const screenshot = await page.screenshot({ fullPage: true });
return { title, screenshotSize: screenshot.length };
```
