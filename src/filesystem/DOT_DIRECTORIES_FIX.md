# Dot Directories Fix for MCP Filesystem Server

## Overview

This fix addresses issue #2219 where dot directories (like `.git`, `.terraform`, etc.) were being included in filesystem MCP search tools, causing massive token usage and potential security issues.

## Changes Made

### 1. Added Environment Variable Support
- Added `MCP_FILESYSTEM_SHOW_DOT_DIRECTORIES` environment variable
- When set to `'true'`, dot directories are shown by default
- When not set or set to any other value, dot directories are hidden by default

### 2. Helper Functions
- `isDotPath(name: string)`: Checks if a file/directory name starts with a dot
- `shouldShowDotDirectories(showDot?: boolean)`: Determines whether to show dot directories based on parameter or environment variable

### 3. Updated Tool Schemas
Added optional `showDot` parameter to the following tools:
- `list_directory`
- `list_directory_with_sizes`
- `directory_tree`
- `search_files`

### 4. Updated Tool Implementations
Modified the following functions to filter out dot directories by default:
- `list_directory` handler
- `list_directory_with_sizes` handler
- `directory_tree` handler and `buildTree` function
- `search_files` handler and `searchFiles` function

### 5. Updated Tool Descriptions
Enhanced tool descriptions to mention that dot directories are hidden by default for security and performance reasons, with instructions on how to include them using the `showDot` parameter.

## Usage

### Default Behavior (Dot Directories Hidden)
```bash
# Dot directories will be hidden by default
node index.js /path/to/directory
```

### Show Dot Directories via Environment Variable
```bash
# Show dot directories for all operations by default
MCP_FILESYSTEM_SHOW_DOT_DIRECTORIES=true node index.js /path/to/directory
```

### Show Dot Directories via Tool Parameter
```json
{
  "name": "list_directory",
  "arguments": {
    "path": "/path/to/directory",
    "showDot": true
  }
}
```

## Security Benefits

1. **Reduced Token Usage**: Excluding large directories like `.git` significantly reduces token consumption
2. **Information Security**: Prevents accidental exposure of sensitive information in dot directories
3. **Performance**: Faster directory operations by skipping hidden directories
4. **Backward Compatibility**: Existing integrations continue to work with the new default behavior

## Impact on Issue #2219

This fix directly addresses the reported issue by:
- ✅ Hiding dot directories by default
- ✅ Providing environment variable control (`MCP_FILESYSTEM_SHOW_DOT_DIRECTORIES`)
- ✅ Providing per-operation control via `showDot` parameter
- ✅ Maintaining backward compatibility
- ✅ Improving security and performance

## Testing

The fix can be tested by:
1. Running directory listing operations on a directory containing `.git`
2. Verifying that dot directories are hidden by default
3. Verifying that dot directories are shown when `showDot: true` is passed
4. Verifying that the environment variable works correctly