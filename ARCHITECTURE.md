# MCP Server Architecture

## Overview

The n8n Playwright MCP Server has been refactored into a modular architecture that makes it easy to add, remove, and maintain tools.

## Directory Structure

```
src/
├── server.ts                  # Main server entry point
├── shared/
│   └── types.ts              # Shared TypeScript interfaces
├── utils/
│   ├── fileUtils.ts          # File management utilities
│   └── responseUtils.ts      # Response formatting utilities
└── tools/
    ├── registry.ts           # Central tool registry
    ├── core/                 # Core browser automation tools
    │   ├── index.ts
    │   ├── navigate.ts       # browser_navigate
    │   ├── getContent.ts     # get_page_content
    │   ├── screenshot.ts     # take_screenshot
    │   ├── close.ts          # browser_close
    │   └── sessionInfo.ts    # browser_session_info
    ├── qa/                   # QA and analysis tools
    │   ├── index.ts
    │   ├── findSelector.ts   # find_selector_by_text
    │   └── analyzeSections.ts # analyze_page_sections
    └── interaction/          # Enhanced interaction tools
        ├── index.ts
        └── click.ts          # click_element
```

## Key Components

### Tool Registry (`tools/registry.ts`)

Central hub for managing all available tools. To add a new tool:

1. Create the tool file in the appropriate category folder
2. Export it from the category's `index.ts`
3. Import and add it to `AVAILABLE_TOOLS` array in registry
4. The server will automatically register it

To remove a tool:
1. Remove it from the `AVAILABLE_TOOLS` array
2. Optionally delete the tool file

### Tool Definition Interface

Each tool follows this structure:

```typescript
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: ToolFunction;
}
```

### Tool Categories

- **Core** (`tools/core/`): Essential browser automation
- **QA** (`tools/qa/`): Quality assurance and analysis
- **Interaction** (`tools/interaction/`): Enhanced user interactions

## Adding New Tools

### Example: Adding a new interaction tool

1. Create `src/tools/interaction/fillForm.ts`:

```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../../shared/types.js';
import { createSuccessResponse, createErrorResponse } from '../../utils/responseUtils.js';

const schema = z.object({
  sessionId: z.string().optional(),
  selector: z.string(),
  value: z.string()
});

async function handler(params: z.infer<typeof schema>, context: ToolContext) {
  // Implementation here
}

export const fillFormField: ToolDefinition = {
  name: 'fill_form_field',
  description: 'Fill form inputs for testing',
  inputSchema: schema,
  handler
};
```

2. Export from `src/tools/interaction/index.ts`:

```typescript
export { fillFormField } from './fillForm.js';
```

3. Add to `src/tools/registry.ts`:

```typescript
import { fillFormField } from './interaction/index.js';

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  // ... existing tools
  fillFormField
];
```

4. Restart the server - the new tool is automatically registered!

## Benefits

✅ **Modular**: Tools are organized by category
✅ **Maintainable**: Easy to add/remove individual tools
✅ **Type Safe**: Full TypeScript support throughout
✅ **Consistent**: Standardized patterns for all tools
✅ **Scalable**: Architecture supports growth

## Tool Status

### Implemented (8 tools):
- ✅ browser_navigate
- ✅ get_page_content
- ✅ take_screenshot
- ✅ browser_close
- ✅ browser_session_info
- ✅ find_selector_by_text
- ✅ analyze_page_sections
- ✅ click_element

### Ready to Add:
- 🔄 fill_form_field
- 🔄 wait_for_element
- 🔄 get_page_metrics
- 🔄 check_broken_links
- 🔄 capture_section_screenshots
- 🔄 analyze_page_qa

The remaining tools from the original monolithic file can be easily added following the modular pattern demonstrated above.