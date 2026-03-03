#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = '/root/src/pacman/src';

function getExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const exports = {
    named: [],
    default: null,
    all: []
  };

  lines.forEach((line, index) => {
    line = line.trim();

    // Named exports
    const namedMatch = line.match(/^export\s+(class|function|const|let|var)\s+(\w+)/);
    if (namedMatch) {
      exports.named.push({
        type: namedMatch[1],
        name: namedMatch[2],
        line: index + 1
      });
    }

    // Export from
    const fromMatch = line.match(/^export\s+{\s*([^}]+)\s*}\s*from\s+['"]([^'"]+)['"]/);
    if (fromMatch) {
      exports.named.push({
        type: 'from',
        names: fromMatch[1].split(',').map(s => s.trim().split(' as ').pop()),
        from: fromMatch[2],
        line: index + 1
      });
    }

    // Export *
    const starMatch = line.match(/^export\s+\*\s+from\s+['"]([^'"]+)['"]/);
    if (starMatch) {
      exports.named.push({
        type: '*',
        from: starMatch[1],
        line: index + 1
      });
    }

    // Default exports
    const defaultMatch = line.match(/^export\s+default\s+/);
    if (defaultMatch) {
      exports.default = {
        line: index + 1,
        statement: line
      };
    }

    exports.all.push({
      line: index + 1,
      statement: line
    });
  });

  return exports;
}

function auditDirectory(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.startsWith('node_modules') && file.name !== '__tests__') {
      auditDirectory(fullPath, results);
    } else if (file.isFile() && file.name.endsWith('.js')) {
      try {
        const exports = getExports(fullPath);
        const relativePath = path.relative(srcDir, fullPath);

        results.push({
          path: relativePath,
          fullPath: fullPath,
          exports: exports
        });
      } catch (error) {
        console.error(`Error reading ${fullPath}:`, error.message);
      }
    }
  }

  return results;
}

function generateReport(results) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 EXPORT AUDIT REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalFiles = 0;
  let defaultExports = 0;
  let namedExports = 0;
  let bothExports = 0;
  let noExports = 0;

  const categorized = {
    facades: [],
    core: [],
    systems: [],
    utils: [],
    views: [],
    audio: [],
    other: []
  };

  results.forEach(result => {
    totalFiles++;
    const { exports, path } = result;

    if (exports.default) defaultExports++;
    if (exports.named.length > 0) namedExports++;
    if (exports.default && exports.named.length > 0) bothExports++;
    if (!exports.default && exports.named.length === 0) noExports++;

    // Categorize
    if (path.includes('GameModel.js') || path.includes('ModelDrivenGameView.js') || path.includes('TechSoundManager.js')) {
      categorized.facades.push(result);
    } else if (path.includes('/core/') || path.includes('GameState') || path.includes('EntityRegistry')) {
      categorized.core.push(result);
    } else if (path.includes('/systems/') || path.includes('System.js')) {
      categorized.systems.push(result);
    } else if (path.includes('/utils/') || path.includes('Helper')) {
      categorized.utils.push(result);
    } else if (path.includes('/views/')) {
      categorized.views.push(result);
    } else if (path.includes('/audio/')) {
      categorized.audio.push(result);
    } else {
      categorized.other.push(result);
    }
  });

  // Summary
  console.log('📈 SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Total Files:        ${totalFiles}`);
  console.log(`Default Exports:    ${defaultExports} (${((defaultExports/totalFiles)*100).toFixed(1)}%)`);
  console.log(`Named Exports:      ${namedExports} (${((namedExports/totalFiles)*100).toFixed(1)}%)`);
  console.log(`Both (mixed):       ${bothExports} (${((bothExports/totalFiles)*100).toFixed(1)}%)`);
  console.log(`No Exports:         ${noExports} (${((noExports/totalFiles)*100).toFixed(1)}%)`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🏛️  FACADES (Main Entry Points)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.facades.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎯 CORE MODULES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.core.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⚙️  SYSTEM MODULES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.systems.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('👁️  VIEW MODULES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.views.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔊 AUDIO MODULES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.audio.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🛠️  UTILS & HELPER');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.utils.forEach(r => printModule(r));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📦 OTHER MODULES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  categorized.other.forEach(r => printModule(r));

  // Issues
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⚠️  ISSUES & RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let issues = [];

  results.forEach(result => {
    const { exports, path } = result;

    // Issue: Mixed exports (both default and named)
    if (exports.default && exports.named.length > 0) {
      issues.push({
        type: 'MIXED_EXPORTS',
        path: path,
        severity: 'HIGH',
        message: `Module has both default and named exports. Consider using only one pattern.`
      });
    }

    // Issue: Facades without default export
    if (categorized.facades.includes(result) && !exports.default) {
      issues.push({
        type: 'FACADE_NO_DEFAULT',
        path: path,
        severity: 'HIGH',
        message: `Main facade should have default export.`
      });
    }

    // Issue: Core modules with default export (should use named)
    if (categorized.core.includes(result) && exports.default && !categorized.facades.includes(result)) {
      issues.push({
        type: 'CORE_DEFAULT_EXPORT',
        path: path,
        severity: 'MEDIUM',
        message: `Core module uses default export. Consider named exports.`
      });
    }

    // Issue: No exports at all
    if (!exports.default && exports.named.length === 0) {
      issues.push({
        type: 'NO_EXPORTS',
        path: path,
        severity: 'LOW',
        message: `Module has no exports. Is this intentional?`
      });
    }
  });

  if (issues.length === 0) {
    console.log('✅ No issues found! Export patterns are consistent.\n');
  } else {
    issues.forEach(issue => {
      const icon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${icon} [${issue.type}] ${issue.path}`);
      console.log(`   ${issue.message}\n`);
    });
  }

  return {
    summary: { totalFiles, defaultExports, namedExports, bothExports, noExports },
    categorized,
    issues
  };
}

function printModule(result) {
  const { path, exports } = result;

  if (exports.default) {
    console.log(`📦 ${path}`);
    console.log(`   ✓ export default (line ${exports.default.line})`);
    if (exports.named.length > 0) {
      console.log(`   ⚠️  + ${exports.named.length} named export(s)`);
    }
  } else if (exports.named.length > 0) {
    console.log(`📦 ${path}`);
    console.log(`   ✓ ${exports.named.length} named export(s)`);
    exports.named.forEach(exp => {
      if (exp.type === 'from') {
        console.log(`      - { ${exp.names.slice(0, 3).join(', ')}${exp.names.length > 3 ? '...' : ''} } from ${exp.from}`);
      } else if (exp.type === '*') {
        console.log(`      - * from ${exp.from}`);
      } else {
        console.log(`      - ${exp.type} ${exp.name}`);
      }
    });
  } else {
    console.log(`📦 ${path}`);
    console.log(`   ⚪ No exports`);
  }
  console.log('');
}

// Run audit
const results = auditDirectory(srcDir);
const report = generateReport(results);

// Save report to file
fs.writeFileSync('/root/src/pacman/EXPORT_AUDIT_REPORT.json', JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: report.summary,
  issues: report.issues
}, null, 2));

console.log('\n💾 Report saved to: /root/src/pacman/EXPORT_AUDIT_REPORT.json');
