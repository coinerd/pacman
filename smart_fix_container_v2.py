import re

def smart_fix_container(content):
    """Only change container to _container if it's not used in the function body"""
    
    lines = content.split('\n')
    result_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line has (container) => pattern
        match = re.search(r'\(container\)\s*=>', line)
        if match:
            # Find the end of this function (look for the closing parenthesis/brace)
            # Collect lines until we find the function end
            lookahead_lines = []
            j = i + 1
            paren_depth = line.count('(') - line.count(')')
            brace_depth = line.count('{') - line.count('}')
            
            while j < len(lines) and (paren_depth > 0 or brace_depth > 0):
                lookahead_lines.append(lines[j])
                paren_depth += lines[j].count('(') - lines[j].count(')')
                brace_depth += lines[j].count('{') - lines[j].count('}')
                j += 1
            
            lookahead = '\n'.join(lookahead_lines)
            
            # Check if container is actually used (not just as a parameter)
            # Look for container.get, container.something, etc.
            # But NOT just (container) or , container)
            container_used = False
            if re.search(r'\bcontainer\.\w+', lookahead):
                container_used = True
            if re.search(r'\bcontainer\s*\)', lookahead) and not re.search(r'\(\s*container\s*\)', lookahead):
                # container is used as an argument, not just as a parameter
                container_used = True
            
            if not container_used:
                # Container is not used, change to _container
                modified_line = re.sub(r'\(container\)\s*=>', r'(_container) =>', line)
                result_lines.append(modified_line)
                print(f"Line {i+1}: Changed container to _container (not used)")
            else:
                result_lines.append(line)
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

print(f"\nFixed {filepath}")

# Fix FeatureSystems.js  
filepath = 'src/core/FeatureSystems.js'
with open(filepath, 'r') as f:
    content = f.read()

fixed_content = smart_fix_container(content)

with open(filepath, 'w') as f:
    f.write(fixed_content)

print(f"Fixed {filepath}")
