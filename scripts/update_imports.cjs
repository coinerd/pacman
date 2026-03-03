#!/usr/bin/env node

/**
 * Update all default imports to named imports
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const SRC_DIR = '/root/src/pacman/src';

// Map of module path to exported name (from our migration)
const MODULE_EXPORTS = {
  './audio/TechSoundManagerRefactored.js': 'TechSoundManagerRefactored',
  './controllers/GameController.js': 'GameController',
  './effects/ParticleEffectManager.js': 'ParticleEffect',
  './input/InputAdapter.js': 'InputAdapter',
  './input/InputManager.js': 'InputManager',
  './input/adapters/AIInputAdapter.js': 'AIInputAdapter',
  './input/adapters/KeyboardAdapter.js': 'KeyboardAdapter',
  './input/adapters/ReplayAdapter.js': 'ReplayAdapter',
  './managers/TechSoundManager.js': 'TechSoundManager',
  './model/PlayerScoreFacade.js': 'PlayerScoreFacade',
  './systems/AdditionalPowerUpSystem.js': 'AdditionalPowerUpSystem',
  './views/RefactoredViewExample.js': 'DecoupledGameView',
  './views/core/ViewManager.js': 'ViewManager'
};

function updateFileImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let changes = 0;

  // Find all import statements that might need updating
  const importRegex = /import\s+([^{};\n]+?)\s+from\s+['"]([^'"]+)['"]/g;

  const matches = [...content.matchAll(importRegex)];

  matches.forEach(match => {
    const [fullMatch, imported, modulePath] = match;
    const startPos = match.index;
    const endPos = startPos + fullMatch.length;

    // Skip named imports
    if (imported.includes('{')) {
      return;
    }

    // Check if this module was migrated
    const exportName = MODULE_EXPORTS[modulePath];
    if (!exportName) {
      return;
    }

    // Skip if already using named import
    if (imported === `{ ${exportName} }`) {
      return;
    }

    // Transform: import X from 'module' → import { X } from 'module'
    const namedImport = `import { ${exportName} } from '${modulePath}'`;

    // Replace in content
    updated = updated.substring(0, startPos) + namedImport + updated.substring(endPos);
    changes++;

    console.log(`   ${filePath}: ${imported.trim()} → { ${exportName} }`);
  });

  if (changes > 0) {
    fs.writeFileSync(filePath, updated, 'utf-8');
  }

  return changes;
}

async function run() {
  console.log('🔧 Updating default imports to named imports...\n');

  const jsFiles = glob.sync('**/*.js', {
    cwd: SRC_DIR,
    ignore: ['**/node_modules/**', '**/__tests__/**']
  });

  let totalChanges = 0;

  for (const file of jsFiles) {
    const fullPath = path.join(SRC_DIR, file);
    const changes = updateFileImports(fullPath);
    totalChanges += changes;
  }

  console.log(`\n✅ Total changes: ${totalChanges}`);
}

run().catch(console.error);
