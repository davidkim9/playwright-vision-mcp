# Simple Playwright MCP Server

![Let it run code](image.png)

A powerful Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. This server enables AI assistants like Claude/Cursor/ChatGPT to interact with web pages, extract content, take screenshots, and execute custom browser automation scripts.

This package minimizes the amount of tools to help AI Agents pick the right tool for a given prompt.

## Features

- 🌐 **Multi-Browser Support** - Chromium, Firefox, and WebKit
- 🔄 **Session Management** - Persistent browser sessions for multi-step workflows
- 📸 **Screenshot Capture** - Full-page and element-specific screenshots
- 📝 **Content Extraction** - Text content from pages or specific selectors
- 🖱️ **Element Interaction** - Click elements and interact with pages
- 🎭 **Custom Scripts** - Execute arbitrary Playwright code
- 🚀 **Dual Transport** - HTTP and stdio (for Claude Code)

For detailed information about available tools, see [tools.md](tools.md).

## Table of Contents

- [Simple Playwright MCP Server](#simple-playwright-mcp-server)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Quick Start](#quick-start)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Cursor / Claude Code / Claude Desktop Configuration](#cursor--claude-code--claude-desktop-configuration)
    - [HTTP Transport (for n8n or other HTTP clients)](#http-transport-for-n8n-or-other-http-clients)
  - [Development](#development)
    - [Development Scripts](#development-scripts)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Logging](#debug-logging)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

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

   This will install + build + install playwright browsers

3. **Run the server (http only)**


   For HTTP transport (n8n):
   ```bash
   npm start
   ```

   For configuration based clients: [MCP Configuration](#configuration)

## Configuration

### Environment Variables

Configure the server behavior using environment variables:

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `PLAYWRIGHT_HEADLESS` | Run browser in headless mode | `true` | `true`, `false` |
| `BROWSER_TYPE` | Browser engine to use | `chromium` | `chromium`, `firefox`, `webkit` |
| `SCREENSHOT_DIR` | Directory for saving screenshots | `./screenshots` | Any valid path |
| `PORT` | HTTP server port | `4201` | Any valid port number |
| `MCP_AUTH_TOKEN` | Authentication token for HTTP server (optional) | None | Any string |
| `RETURN_SCREENSHOTS` | Return base64 screenshot data to agent | `false` | `true`, `false` |

### Cursor / Claude Code / Claude Desktop Configuration

To use this server with Cursor/Claude Code/Claude Desktop, add it to your MCP settings file.

**Configuration:**
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
        "SCREENSHOT_DIR": "/Users/yourname/projects/playwright-mcp/screenshots",
        "RETURN_SCREENSHOTS": "false"
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
PORT=4201 npm start

# With authentication (recommended)
MCP_AUTH_TOKEN=your-secret-token npm start
```

The server will listen on `http://localhost:4201/mcp` (or your custom port).

**Authentication (Optional):**

You can secure the HTTP server with token-based authentication by setting the `MCP_AUTH_TOKEN` environment variable. If set, all requests must include the token in the `Authorization` header.

**Example HTTP Request (with authentication):**
```bash
curl -X POST http://localhost:4201/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "navigate",
      "arguments": {
        "url": "https://example.com"
      }
    }
  }'
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
Error: listen EADDRINUSE: address already in use :::4201
```
Solution: Change the port with `PORT=4201 npm start`

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
