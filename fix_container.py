import re

def fix_container_params(content):
    """Fix all unused container parameters"""
    
    # Pattern to match (container) => or (container) { at end of line
    # This handles both arrow functions and regular functions
    patterns = [
        # Arrow function: (container) => at end of line
        (r'\(container\)\s*=>', r'(_container) =>'),
        
        # With comma: (container, other) =>
        (r'\(container,\s*', r'(_container, '),
        
        # At end with comma: (other, container) =>
        (r',\s*container\)\s*=>', r', _container) =>'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

# Fix ServiceRegistry.js
filepath = 'src/core/ServiceRegistry.js'
with open(filepath, 'r') as f:
    content = f.read()

fixed_content = fix_container_params(content)

with open(filepath, 'w') as f:
    f.write(fixed_content)

print(f"Fixed {filepath}")

# Fix FeatureSystems.js
filepath = 'src/core/FeatureSystems.js'
with open(filepath, 'r') as f:
    content = f.read()

fixed_content = fix_container_params(content)

with open(filepath, 'w') as f:
    f.write(fixed_content)

print(f"Fixed {filepath}")
