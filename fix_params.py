import re
import sys

def fix_unused_params(content):
    """Prefix unused parameters in interface methods with _"""
    
    # Pattern to match function parameters that are unused
    # Only in interface files where methods throw 'Not implemented'
    patterns = [
        # Single parameters
        (r'(\w+)\((container)\)\s*{', r'\1(_container) {'),
        (r'(\w+)\((gridX),\s*(gridY)\)\s*{', r'\1(_gridX, _gridY) {'),
        (r'(\w+)\((entityId)', r'\1(_entityId'),
        (r'(\w+)\((deltaTime)\)', r'\1(_deltaTime)'),
        (r'(\w+)\((deltaSeconds)', r'\1(_deltaSeconds'),
        (r'(\w+)\((context)\)', r'\1(_context)'),
        (r'(\w+)\((options)\)', r'\1(_options)'),
        (r'(\w+)\((mazeGrid)', r'\1(_mazeGrid'),
        (r'(\w+)\((config)\)', r'\1(_config)'),
        (r'(\w+)\((direction)\)', r'\1(_direction)'),
        (r'(\w+)\((speed)\)', r'\1(_speed)'),
        (r'(\w+)\((duration)\)', r'\1(_duration)'),
        (r'(\w+)\((multiplier)\)', r'\1(_multiplier)'),
        (r'(\w+)\((mode)\)', r'\1(_mode)'),
        (r'(\w+)\((snapshot)\)', r'\1(_snapshot)'),
        (r'(\w+)\((delta)\)', r'\1(_delta)'),
        (r'(\w+)\((maze)\)', r'\1(_maze)'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 fix_params.py <file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    with open(filepath, 'r') as f:
        content = f.read()
    
    fixed_content = fix_unused_params(content)
    
    with open(filepath, 'w') as f:
        f.write(fixed_content)
    
    print(f"Fixed {filepath}")
