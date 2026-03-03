#!/usr/bin/env node

/**
 * Phase 8: Unified Export Pattern Migration Script
 *
 * Converts mixed/default exports to named exports and updates all imports.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = '/root/src/pacman/src';

// Files that need migration (from audit)
const FILES_TO_MIGRATE = [
  'audio/TechSoundManagerRefactored.js',
  'config/themeConfig.js',
  'controllers/GameController.js',
  'effects/ParticleEffectManager.js',
  'input/InputAdapter.js',
  'input/InputManager.js',
  'input/adapters/AIInputAdapter.js',
  'input/adapters/KeyboardAdapter.js',
  'input/adapters/ReplayAdapter.js',
  'managers/TechSoundManager.js',
  'managers/TechSoundManager.legacy.js',
  'model/PlayerScoreFacade.js',
  'packages/@pacman/core/index.js',
  'packages/@pacman/movement/index.js',
  'packages/@pacman/utils/index.js',
  'systems/AdditionalPowerUpSystem.js',
  'views/RefactoredViewExample.js',
  'views/core/ViewManager.js'
];

/**
 * Extract class/function/const names from export statements
 */
function extractExportNames(content) {
  const patterns = [
    // export class ClassName
    { regex: /export\s+class\s+(\w+)/, type: 'class' },
    // export function functionName
    { regex: /export\s+function\s+(\w+)/, type: 'function' },
    // export const/let/var name
    { regex: /export\s+(?:const|let|var)\s+(\w+)/, type: 'const' },
    // export { name } from ...
    { regex: /export\s*{\s*([^}]+)\s*}\s*from/, type: 'reexport' },
    // export * from ...
    { regex: /export\s+\*\s+from/, type: 'wildcard' }
  ];

  const namedExports = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (type === 'class' || type === 'function' || type === 'const') {
        namedExports.push({ name: match[1], type });
      } else if (type === 'reexport') {
        const exports = match[1].split(',').map(s => s.trim());
        exports.forEach(exp => {
          const parts = exp.split(/\s+as\s+/);
          const name = parts[parts.length - 1].trim();
          if (name !== 'default') {
            namedExports.push({ name, type: 'reexport' });
          }
        });
      } else if (type === 'wildcard') {
        namedExports.push({ name: '*', type: 'wildcard' });
      }
    }
  });

  return namedExports;
}

/**
 * Find the class name being exported as default
 */
function findDefaultExportName(content) {
  // export default class ClassName
  const classMatch = content.match(/export\s+default\s+class\s+(\w+)/);
  if (classMatch) return classMatch[1];

  // export default function functionName
  const funcMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (funcMatch) return funcMatch[1];

  // export default const/let/var name
  const constMatch = content.match(/export\s+default\s+(?:const|let|var)\s+(\w+)/);
  if (constMatch) return constMatch[1];

  // export default ClassName (declaration on separate line)
  const declMatch = content.match(/class\s+(\w+)/);
  if (declMatch) {
    const className = declMatch[1];
    // Check if it's exported on a different line
    if (content.match(/export\s+default\s+\b/)) {
      return className;
    }
  }

  return null;
}

/**
 * Migrate a single file to use named exports
 */
function migrateFile(filePath) {
  console.log(`\n📝 Migrating: ${filePath}`);

  const fullPath = path.join(SRC_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Check if migration is needed
  if (!content.includes('export default')) {
    console.log(`   ✅ Already using named exports`);
    return { success: true, changes: 0 };
  }

  let changes = 0;
  const originalContent = content;

  // Find the default export name
  const defaultName = findDefaultExportName(content);
  if (!defaultName) {
    console.log(`   ⚠️  Could not find default export name`);
    return { success: false, changes: 0 };
  }

  console.log(`   🔍 Default export: ${defaultName}`);

  // Step 1: Convert export default to export class/function/const
  content = content.replace(
    /export\s+default\s+class\s+(\w+)/,
    'export class $1'
  );
  content = content.replace(
    /export\s+default\s+function\s+(\w+)/,
    'export function $1'
  );
  content = content.replace(
    /export\s+default\s+(?:const|let|var)\s+(\w+)/,
    'export const $1'
  );

  // Step 2: Handle separate export default statements
  // Pattern: class ClassName ... \n export default ClassName
  const separateExportPattern = /export\s+default\s+\b/;
  if (separateExportPattern.test(content) && !content.match(/export\s+default\s+(?:class|function|const|let|var)/)) {
    // Remove the separate export default line
    content = content.replace(/\n\s*export\s+default\s+\w+\s*/g, '');
    changes++;
  }

  if (content !== originalContent) {
    changes++;

    // Write back
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`   ✅ Migrated ${defaultName} to named export`);
  }

  return { success: true, changes };
}

/**
 * Find all files that import from a module
 */
function findImporters(modulePath) {
  const jsFiles = glob.sync('**/*.js', {
    cwd: SRC_DIR,
    ignore: ['**/node_modules/**', '**/__tests__/**']
  });

  const importers = [];

  jsFiles.forEach(file => {
    const fullPath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Check for import of this module
    const importPatterns = [
      // import Something from 'module'
      new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${modulePath}['"]`),
      // import { Something } from 'module'
      new RegExp(`import\\s*{\\s*([^}]+)\\s*}\\s*from\\s+['"]${modulePath}['"]`),
      // import Something, { Other } from 'module'
      new RegExp(`import\\s+(\\w+),\\s*{([^}]+)}\\s+from\\s+['"]${modulePath}['"]`)
    ];

    importPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        importers.push({
          file,
          fullPath,
          content,
          matches: matches
        });
      }
    });
  });

  return importers;
}

/**
 * Update imports in a file to use named imports
 */
function updateImports(content, modulePath, exportName) {
  let updated = content;
  let changes = 0;

  // Pattern 1: import Something from 'module' → import { Something } from 'module'
  const pattern1 = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"]${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
    'g'
  );

  updated = updated.replace(pattern1, (match, importName) => {
    if (importName === exportName) {
      changes++;
      return `import { ${importName} } from '${modulePath}'`;
    }
    return match;
  });

  return { updated, changes };
}

/**
 * Run full migration
 */
async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 PHASE 8: EXPORT MIGRATION STARTING');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalMigrated = 0;
  let totalChanges = 0;
  const migrationResults = [];

  // Step 1: Migrate files to use named exports
  console.log('\n📦 STEP 1: MIGRATING EXPORTS');
  console.log('─'.repeat(60));

  for (const filePath of FILES_TO_MIGRATE) {
    const fullPath = path.join(SRC_DIR, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      continue;
    }

    const result = migrateFile(filePath);
    migrationResults.push({ filePath, ...result });

    if (result.success && result.changes > 0) {
      totalMigrated++;
      totalChanges += result.changes;
    }
  }

  console.log(`\n✅ Step 1 complete: ${totalMigrated} files migrated`);

  // Step 2: Update imports across codebase
  console.log('\n🔧 STEP 2: UPDATING IMPORTS');
  console.log('─'.repeat(60));

  let totalImportsUpdated = 0;
  const importUpdates = [];

  for (const result of migrationResults) {
    if (!result.success) continue;

    const { filePath } = result;
    const fullPath = path.join(SRC_DIR, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Find the exported name
    const exportName = findDefaultExportName(content);
    if (!exportName) continue;

    // Find files importing this module
    const moduleImportPath = `./${filePath}`;
    const importers = findImporters(moduleImportPath);

    if (importers.length > 0) {
      console.log(`\n   📥 Updating imports for ${exportName} (${importers.length} files)`);

      importers.forEach(importer => {
        const { file, fullPath: importerPath, content: importerContent } = importer;
        const { updated, changes } = updateImports(
          importerContent,
          moduleImportPath,
          exportName
        );

        if (changes > 0) {
          fs.writeFileSync(importerPath, updated, 'utf-8');
          console.log(`      ✓ ${file}`);
          totalImportsUpdated++;
          importUpdates.push({ file, changes });
        }
      });
    }
  }

  console.log(`\n✅ Step 2 complete: ${totalImportsUpdated} imports updated`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Files migrated:    ${totalMigrated}`);
  console.log(`Exports changed:   ${totalChanges}`);
  console.log(`Imports updated:   ${totalImportsUpdated}`);
  console.log('\n✅ Migration complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run tests: npm test');
  console.log('   2. Commit changes');
  console.log('   3. Update PHASE8_EXPORT_PATTERN.md');
}

// Run migration
runMigration().catch(console.error);
