import { beforeEach, describe, expect, test } from '@jest/tools';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Note: This is a conceptual test file showing how the fix should work
// It would need to be integrated into the existing test suite

describe('Dot Directories Filter Fix', () => {
  let testDir: string;
  
  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    
    // Create some test files and directories
    await fs.mkdir(path.join(testDir, '.git'));
    await fs.mkdir(path.join(testDir, '.vscode'));
    await fs.mkdir(path.join(testDir, '.terraform'));
    await fs.mkdir(path.join(testDir, 'src'));
    await fs.mkdir(path.join(testDir, 'docs'));
    await fs.writeFile(path.join(testDir, '.gitignore'), '');
    await fs.writeFile(path.join(testDir, '.env'), '');
    await fs.writeFile(path.join(testDir, 'README.md'), '');
    await fs.writeFile(path.join(testDir, 'package.json'), '{}');
  });
  
  test('list_directory should hide dot directories by default', async () => {
    // Test that dot directories are filtered out by default
    const entries = await fs.readdir(testDir, { withFileTypes: true });
    const showDotDirectories = false; // Default behavior
    
    const filteredEntries = showDotDirectories 
      ? entries 
      : entries.filter(entry => !entry.name.startsWith('.'));
    
    const visibleNames = filteredEntries.map(entry => entry.name);
    
    expect(visibleNames).toContain('src');
    expect(visibleNames).toContain('docs');
    expect(visibleNames).toContain('README.md');
    expect(visibleNames).toContain('package.json');
    
    expect(visibleNames).not.toContain('.git');
    expect(visibleNames).not.toContain('.vscode');
    expect(visibleNames).not.toContain('.terraform');
    expect(visibleNames).not.toContain('.gitignore');
    expect(visibleNames).not.toContain('.env');
  });
  
  test('list_directory should show dot directories when showDot=true', async () => {
    // Test that dot directories are included when explicitly requested
    const entries = await fs.readdir(testDir, { withFileTypes: true });
    const showDotDirectories = true; // Explicit show
    
    const filteredEntries = showDotDirectories 
      ? entries 
      : entries.filter(entry => !entry.name.startsWith('.'));
    
    const visibleNames = filteredEntries.map(entry => entry.name);
    
    // Should contain all files and directories
    expect(visibleNames).toContain('src');
    expect(visibleNames).toContain('docs');
    expect(visibleNames).toContain('README.md');
    expect(visibleNames).toContain('package.json');
    expect(visibleNames).toContain('.git');
    expect(visibleNames).toContain('.vscode');
    expect(visibleNames).toContain('.terraform');
    expect(visibleNames).toContain('.gitignore');
    expect(visibleNames).toContain('.env');
  });
  
  test('search_files should exclude dot directories by default', async () => {
    // Create some files in dot directories
    await fs.writeFile(path.join(testDir, '.git', 'config'), '');
    await fs.writeFile(path.join(testDir, '.vscode', 'settings.json'), '{}');
    await fs.writeFile(path.join(testDir, 'src', 'config.js'), '');
    
    // Simulate the filtering logic from searchFiles function
    const searchInDirectory = async (dirPath: string, showDot: boolean = false): Promise<string[]> => {
      const results: string[] = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!showDot && entry.name.startsWith('.')) {
          continue; // Skip dot directories/files
        }
        
        const fullPath = path.join(dirPath, entry.name);
        if (entry.name.includes('config')) {
          results.push(fullPath);
        }
        
        if (entry.isDirectory()) {
          const subResults = await searchInDirectory(fullPath, showDot);
          results.push(...subResults);
        }
      }
      
      return results;
    };
    
    const results = await searchInDirectory(testDir, false);
    
    // Should find config.js in src but not config in .git
    expect(results.some(r => r.includes('src/config.js'))).toBe(true);
    expect(results.some(r => r.includes('.git/config'))).toBe(false);
    expect(results.some(r => r.includes('.vscode/settings.json'))).toBe(false);
  });
  
  test('search_files should include dot directories when showDot=true', async () => {
    // Create some files in dot directories
    await fs.writeFile(path.join(testDir, '.git', 'config'), '');
    await fs.writeFile(path.join(testDir, '.vscode', 'settings.json'), '{}');
    await fs.writeFile(path.join(testDir, 'src', 'config.js'), '');
    
    // Simulate the filtering logic from searchFiles function
    const searchInDirectory = async (dirPath: string, showDot: boolean = false): Promise<string[]> => {
      const results: string[] = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!showDot && entry.name.startsWith('.')) {
          continue; // Skip dot directories/files
        }
        
        const fullPath = path.join(dirPath, entry.name);
        if (entry.name.includes('config') || entry.name.includes('settings')) {
          results.push(fullPath);
        }
        
        if (entry.isDirectory()) {
          const subResults = await searchInDirectory(fullPath, showDot);
          results.push(...subResults);
        }
      }
      
      return results;
    };
    
    const results = await searchInDirectory(testDir, true);
    
    // Should find all config-related files
    expect(results.some(r => r.includes('src/config.js'))).toBe(true);
    expect(results.some(r => r.includes('.git/config'))).toBe(true);
    expect(results.some(r => r.includes('.vscode/settings.json'))).toBe(true);
  });
  
  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });
});