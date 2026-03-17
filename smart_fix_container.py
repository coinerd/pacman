import re

def smart_fix_container(content):
    """Only change container to _container if it's not used in the function body"""
    
    lines = content.split('\n')
    result_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line has (container) => pattern
        if re.search(r'\(container\)\s*=>', line):
            # Look ahead to see if container is used in the next few lines
            # (until we hit a closing brace or semicolon)
            lookahead = '\n'.join(lines[i:i+10])  # Check next 10 lines
            
            # If 'container.' or 'container)' appears in the lookahead, it's being used
            if re.search(r'container\.', lookahead) or re.search(r'container\)', lookahead):
                # Container is used, don't change it
                result_lines.append(line)
            else:
                # Container is not used, change to _container
                modified_line = re.sub(r'\(container\)\s*=>', r'(_container) =>', line)
                result_lines.append(modified_line)
        else:
            result_lines.append(line)
        
        i += 1
    
    return '\n'.join(result_lines)

# Fix ServiceRegistry.js
filepath = 'src/core/ServiceRegistry.js'
with open(filepath, 'r') as f:
    content = f.read()

fixed_content = smart_fix_container(content)

with open(filepath, 'w') as f:
    f.write(fixed_content)

print(f"Fixed {filepath}")

# Fix FeatureSystems.js  
filepath = 'src/core/FeatureSystems.js'
with open(filepath, 'r') as f:
    content = f.read()

fixed_content = smart_fix_container(content)

with open(filepath, 'w') as f:
    f.write(fixed_content)

print(f"Fixed {filepath}")
