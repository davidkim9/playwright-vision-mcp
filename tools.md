# Available Tools

Notes:
- Sessions are server-managed. Use `navigate_url` first to create or reuse the current session. Other tools operate on the active session; no explicit `sessionId` parameter is required.
- Element selectors use standard CSS selectors.

### 1. `navigate_url`
Navigate to a URL and analyze the page for sections and internal links.

**Parameters:**
- `url` (required): The URL to navigate to
- `waitUntil` (optional): One of `networkidle`, `load`, `domcontentloaded` (fallbacks are applied automatically)
- `timeoutMs` (optional): Per-attempt navigation timeout in milliseconds (default: 30000)
- `retries` (optional): Number of retry cycles after trying all fallbacks (default: 1, max: 5)
- `retryDelayMs` (optional): Delay between retry cycles in milliseconds (default: 750)

**Returns:**
- Page title, URL, and HTTP status
- Browser type
- Identified sections (semantic, visual, layout) with basic metadata
- Internal links on the same domain
- Summary statistics (counts and truncation info)

### 2. `get_content`
Extract text content from the page or a specific element.

**Parameters:**
- `selector` (optional): CSS selector to extract content from; if omitted, extracts the full page body text

**Returns:**
- Extracted text content (may be truncated for brevity)
- Content length and truncation info
- Page title, URL, and the selector used

### 3. `click_element`
Click on an element using a CSS selector.

**Parameters:**
- `selector` (required): CSS selector of the element to click

**Returns:**
- Success status and message
- Current URL and page title after the click
- Click method and target

### 4. `close_session`
Close all browser sessions managed by the server.

**Parameters:**
- None

**Returns:**
- Number of closed sessions and any errors
- Per-session results with `sessionId` and status

### 5. `run_playwright`
Execute custom async Playwright code with access to `page`, `context`, `browser`, `params`, and a captured `console`.

**Parameters:**
- `code` (required): Async JavaScript code body to execute
- `timeoutMs` (optional): Execution timeout in milliseconds (default: 15000, max: 120000)

**Returns:**
- Serialized return value from executed code
- Execution duration and captured console logs
- Current page title and URL

**Example:**
```javascript
const title = await page.title();
await page.click('a');
return { title };
```

### 6. `analyze_image` (conditional)
Capture the current viewport and analyze it with OpenAI Vision.

Availability:
- Requires `OPENAI_API_KEY` to be set
- Requires an active session (start with `navigate_url`)

**Parameters:**
- `prompt` (required): Instruction for analyzing the current viewport screenshot

**Returns:**
- Page title and URL
- OpenAI model, prompt, and response text
- Note: A viewport screenshot is saved under the `screenshots/<sessionId>/` directory; the image data is not included in the response
