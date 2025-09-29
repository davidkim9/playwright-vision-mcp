# Playwright MCP Server

A powerful Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. This server enables AI assistants like Claude to interact with web pages, extract content, take screenshots, and execute custom browser automation scripts.

## Features

- 🌐 **Multi-Browser Support** - Chromium, Firefox, and WebKit
- 🔄 **Session Management** - Persistent browser sessions for multi-step workflows
- 📸 **Screenshot Capture** - Full-page and element-specific screenshots
- 📝 **Content Extraction** - Text content from pages or specific selectors
- 🖱️ **Element Interaction** - Click elements and interact with pages
- 🎭 **Custom Scripts** - Execute arbitrary Playwright code
- 🚀 **Dual Transport** - HTTP and stdio (for Claude Code)

## Available Tools

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

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playwright-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npm run install-browsers
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run the server**

   For HTTP transport (n8n):
   ```bash
   npm start
   ```

   For stdio transport (Claude Code):
   ```bash
   npm run start:stdio
   ```

## Development

### Development Scripts

```bash
# Start HTTP server with auto-reload
npm run dev

# Start stdio server with auto-reload
npm run dev:stdio

# Build TypeScript to JavaScript
npm run build

# Install Playwright browsers
npm run install-browsers
```

### Project Structure

```
playwright-mcp/
├── src/
│   ├── server.ts              # HTTP server (StreamableHTTP transport)
│   ├── stdio-server.ts        # Stdio server (for Claude Code)
│   ├── tools/                 # Tool implementations
│   │   ├── navigate-analyze.ts
│   │   ├── get-content.ts
│   │   ├── screenshot.ts
│   │   ├── click-element.ts
│   │   ├── close-session.ts
│   │   ├── run-playwright.ts
│   │   └── registry.ts        # Tool registration
│   ├── utils/                 # Utility functions
│   │   ├── browserUtils.ts    # Browser session management
│   │   ├── fileUtils.ts       # File operations
│   │   └── responseUtils.ts   # Response formatting
│   └── shared/
│       └── types.ts           # TypeScript types
├── dist/                      # Compiled JavaScript (generated)
├── screenshots/               # Screenshot output directory
├── package.json
├── tsconfig.json
└── README.md
```

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build` to compile
3. Test your changes with `npm run dev` or `npm run dev:stdio`

### Adding New Tools

1. Create a new file in `src/tools/`
2. Implement the `ToolDefinition` interface
3. Register the tool in `src/tools/registry.ts`

Example:
```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { getSession } from '../utils/browserUtils.js';

const schema = z.object({
  sessionId: z.string().optional(),
  // ... your parameters
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  const sessionKey = params.sessionId || 'default';
  const session = getSession(sessionKey, context.browserSessions);

  if (!session) {
    return createErrorResponse('No active browser session found.');
  }

  // ... your tool logic

  return createSuccessResponse({
    success: true,
    // ... your response data
  });
}

export const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Description of what my tool does',
  inputSchema: schema,
  handler
};
```

## Configuration

### Environment Variables

Configure the server behavior using environment variables:

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `PLAYWRIGHT_HEADLESS` | Run browser in headless mode | `true` | `true`, `false` |
| `BROWSER_TYPE` | Browser engine to use | `chromium` | `chromium`, `firefox`, `webkit` |
| `SCREENSHOT_DIR` | Directory for saving screenshots | `./screenshots` | Any valid path |
| `PORT` | HTTP server port | `3000` | Any valid port number |

### Claude Code Configuration

To use this server with Claude Code (or Claude Desktop), add it to your MCP settings file.

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Basic Configuration:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "/absolute/path/to/playwright-mcp/dist/stdio-server.js"
      ],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

**Configuration with Custom Settings:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "/Users/yourname/.nvm/versions/node/v24.4.1/bin/node",
      "args": [
        "/Users/yourname/projects/playwright-mcp/dist/stdio-server.js"
      ],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "BROWSER_TYPE": "chromium",
        "SCREENSHOT_DIR": "/Users/yourname/projects/playwright-mcp/screenshots"
      }
    }
  }
}
```

**Development Configuration (using tsx):**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/playwright-mcp/src/stdio-server.ts"
      ],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "BROWSER_TYPE": "firefox",
        "SCREENSHOT_DIR": "/tmp/playwright-screenshots"
      }
    }
  }
}
```

**Using npm script:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npm",
      "args": [
        "run",
        "start:stdio"
      ],
      "cwd": "/absolute/path/to/playwright-mcp",
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

> **Note:** After updating the configuration, restart Claude Code/Desktop for changes to take effect.

### HTTP Transport (for n8n or other HTTP clients)

Start the HTTP server:
```bash
npm start
# or with custom port
PORT=3001 npm start
```

The server will listen on `http://localhost:3000/mcp` (or your custom port).

**Example HTTP Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "navigate_url",
      "arguments": {
        "url": "https://example.com",
        "sessionId": "my-session"
      }
    }
  }'
```

## Usage Examples

### Basic Navigation and Content Extraction

```javascript
// 1. Navigate to a page
navigate_url({ url: "https://example.com" })

// 2. Extract content from the page
get_content({ selector: ".main-content" })

// 3. Take a screenshot
take_screenshot({ selector: ".important-section" })

// 4. Close the session
close_session({ sessionId: "default" })
```

### Multi-Step Workflow

```javascript
// 1. Navigate and create a session
navigate_url({
  url: "https://github.com/login",
  sessionId: "github-session"
})

// 2. Click the login button
click_element({
  selector: "button[type='submit']",
  sessionId: "github-session"
})

// 3. Run custom code to interact
run_playwright({
  sessionId: "github-session",
  code: `
    // Fill in login form
    await page.fill('#login_field', 'username');
    await page.fill('#password', 'password');
    await page.click('[name="commit"]');

    // Wait for navigation
    await page.waitForNavigation();

    return { loggedIn: true, url: page.url() };
  `
})

// 4. Take screenshot of authenticated page
take_screenshot({ sessionId: "github-session" })

// 5. Close when done
close_session({ sessionId: "github-session" })
```

### Using Different Browsers

Set the `BROWSER_TYPE` environment variable:

```bash
# Use Firefox
BROWSER_TYPE=firefox npm run start:stdio

# Use WebKit (Safari engine)
BROWSER_TYPE=webkit npm run start:stdio
```

### Taking Screenshots with Visible Browser

Useful for debugging or demonstrations:

```bash
PLAYWRIGHT_HEADLESS=false npm run start:stdio
```

## Session Management

Browser sessions are persistent and identified by `sessionId`. This allows for:
- **Multi-step workflows** - Navigate, interact, and extract data across multiple tool calls
- **Parallel sessions** - Run multiple independent browser sessions simultaneously
- **Resource efficiency** - Reuse browser instances instead of creating new ones

**Session Lifecycle:**
1. First `navigate_url` call creates a new session
2. Subsequent calls with the same `sessionId` reuse the session
3. Call `close_session` to explicitly close and free resources
4. Sessions are automatically cleaned up when the server shuts down

**Default Session:**
- If no `sessionId` is provided, the default session `"default"` is used
- This is convenient for single-tab workflows

## Troubleshooting

### Common Issues

**1. Node.js version too old**
```
Error: Playwright requires Node.js 18 or higher
```
Solution: Update Node.js to version 18 or higher.

**2. Browser not installed**
```
Error: Executable doesn't exist at /path/to/browser
```
Solution: Run `npm run install-browsers`

**3. Permission denied (Claude Code)**
```
Error: EACCES: permission denied
```
Solution: Ensure the script has execute permissions and use absolute paths in configuration.

**4. Port already in use (HTTP mode)**
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change the port with `PORT=3001 npm start`

### Debug Logging

For stdio mode, logs are written to stderr and appear in Claude Code logs:
- macOS: `~/Library/Logs/Claude/mcp-server-playwright.log`
- Linux: `~/.config/Claude/logs/mcp-server-playwright.log`

For HTTP mode, logs appear in the terminal where you started the server.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to ensure it compiles
5. Test your changes
6. Submit a pull request

## License

MIT

## Acknowledgments

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) - MCP implementation
- [Zod](https://zod.dev/) - Schema validation
- [Express](https://expressjs.com/) - HTTP server (for n8n mode)
