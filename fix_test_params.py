import re
import sys

def fix_test_params(content, filename):
    """Fix unused parameters in test files"""
    
    # Fix destructuring patterns in tests
    # const { container, ... } = ... -> const { container: _container, ... } = ...
    patterns = [
        # Destructuring with container
        (r'const\s*\{([^}]*),\s*container\s*,([^}]*)\}', r'const {\1, container: _container,\2}'),
        (r'const\s*\{\s*container\s*,([^}]*)\}', r'const { container: _container,\1}'),
        (r'const\s*\{([^}]*)\s*,\s*container\s*\}', r'const {\1, container: _container}'),
        
        # Function parameters
        (r'\((container)\)', r'(_container)'),
        (r'\((container),', r'(_container),'),
        (r',\s*(container)\)', r', _container)'),
        
        # Other common unused params in tests
        (r'const\s*\{\s*themeConfig\s*\}', r'const { themeConfig: _themeConfig }'),
        (r'const\s*\{\s*gameConfig\s*\}', r'const { gameConfig: _gameConfig }'),
        (r'import\s*\{\s*themeConfig\s*\}', r'import { themeConfig as _themeConfig }'),
        (r'import\s*\{\s*gameConfig\s*\}', r'import { gameConfig as _gameConfig }'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

if __name__ == '__main__':
    filepath = sys.argv[1]
    with open(filepath, 'r') as f:
        content = f.read()
    
    fixed_content = fix_test_params(content, filepath)
    
    with open(filepath, 'w') as f:
        f.write(fixed_content)
    
    print(f"Fixed {filepath}")
