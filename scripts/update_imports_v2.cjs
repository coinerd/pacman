#!/usr/bin/env node

/**
 * Find all default imports of local files and convert to named imports
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = '/root/src/pacman/src';

// Read the migrated files to find their export names
function getExportedName(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find export class ClassName
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (classMatch) return classMatch[1];

    // Find export function functionName
    const funcMatch = content.match(/export\s+function\s+(\w+)/);
    if (funcMatch) return funcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

function resolveImportPath(basePath, importPath) {
  // Remove .js extension
  const cleanPath = importPath.replace('.js', '');

  // Resolve relative path
  let resolved = path.join(path.dirname(basePath), cleanPath);

  // Try .js extension
  if (!resolved.endsWith('.js')) {
    resolved += '.js';
  }

  return resolved;
}

function updateFileImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let changes = 0;

  // Find all default imports: import X from 'path'
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+\.js)['"]/g;

  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    const match = line.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);

    if (match) {
      const [fullMatch, importName, modulePath] = match;

      // Skip if it's a named import
      if (importName === '{' || line.includes('{')) {
        newLines.push(line);
        continue;
      }

      // Resolve the actual file path
      const resolvedPath = resolveImportPath(filePath, modulePath);

      // Check if this is a local file (starts with . or ..)
      if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) {
        newLines.push(line);
        continue;
      }

      // Check if the file exists and was migrated
      if (!fs.existsSync(resolvedPath)) {
        newLines.push(line);
        continue;
      }

      // Get the exported name from the file
      const exportedName = getExportedName(resolvedPath);

      if (!exportedName) {
        newLines.push(line);
        continue;
      }

      // If the imported name matches the exported name, convert to named import
      if (importName === exportedName) {
        const namedImport = `import { ${importName} } from '${modulePath}'`;
        newLines.push(namedImport);
        changes++;
        console.log(`   ${path.relative(SRC_DIR, filePath)}: import ${importName} → import { ${importName} }`);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  }

  return changes;
}

async function run() {
  console.log('🔧 Updating default imports to named imports...\n');

  const { execSync } = require('child_process');
  const files = execSync(`find ${SRC_DIR} -name '*.js' -not -path '*/node_modules/*' -not -path '*/__tests__/*'`, { encoding: 'utf-8' }).trim().split('\n');

  let totalChanges = 0;

  for (const file of files) {
    const changes = updateFileImports(file);
    totalChanges += changes;
  }

  console.log(`\n✅ Total changes: ${totalChanges}`);
}

run().catch(console.error);
