#!/usr/bin/env python3

# Read the test file
with open('tests/model/ModelDrivenGameScene.test.js', 'r') as f:
    lines = f.readlines()

# Process lines to add graphics() to mockScene.add objects
output = []
i = 0
while i < len(lines):
    output.append(lines[i])

    # Check if this line contains mockScene = { (not mockScene.add)
    # We want to add graphics() to scene.add, not scene itself
    if 'const mockScene = {' in lines[i]:
        # Look ahead to find the scene.add object
        j = i + 1
        while j < len(lines) and 'mockScene = {' not in lines[j]:
            # Look for scene.add opening
            if 'add: {' in lines[j]:
                # Now find the closing } of scene.add
                k = j + 1
                indent_level = len(lines[j]) - len(lines[j].lstrip())

                while k < len(lines):
                    # Check if this line is the closing }
                    current_indent = len(lines[k]) - len(lines[k].lstrip())
                    if lines[k].strip() == '}' and current_indent == indent_level + 4:
                        # Add graphics() before the closing }
                        indent = ' ' * (indent_level + 8)
                        output.append(f"{indent}graphics: jest.fn(() => ({{\n")
                        output.append(f"{indent}    lineStyle: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    moveTo: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    lineTo: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    fillStyle: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    setDepth: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    setAlpha: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    setVisible: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    clear: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    beginPath: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    closePath: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    fillPath: jest.fn().mockReturnThis(),\n")
                        output.append(f"{indent}    destroy: jest.fn()\n")
                        output.append(f"{indent}})),\n")
                        k += 1
                        break
                    output.append(lines[k])
                    k += 1
                break
            output.append(lines[j])
            j += 1

    i += 1

# Write back
with open('tests/model/ModelDrivenGameScene.test.js', 'w') as f:
    f.writelines(output)

print("Added graphics() to all mockScene.add objects")
