#!/bin/bash
# Fix unused parameters in interface files

for file in src/movement/interfaces/*.js src/core/ServiceRegistry.js src/core/FeatureSystems.js src/input/InputAdapter.js src/input/adapters/KeyboardAdapter.js; do
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        
        # Container parameter
        sed -i 's/(container)/(_container)/g' "$file"
        sed -i 's/(container, /(_container, /g' "$file"
        
        # Grid coordinates
        sed -i 's/(gridX, gridY)/(_gridX, _gridY)/g' "$file"
        
        # Entity IDs
        sed -i 's/(entityId/(_entityId/g' "$file"
        
        # Other common params
        sed -i 's/(deltaTime)/(_deltaTime)/g' "$file"
        sed -i 's/(deltaSeconds/(_deltaSeconds/g' "$file"
        sed -i 's/(context)/(_context)/g' "$file"
        sed -i 's/(options)/(_options)/g' "$file"
        sed -i 's/(mazeGrid/(_mazeGrid/g' "$file"
        sed -i 's/(config)/(_config)/g' "$file"
        sed -i 's/(direction)/(_direction)/g' "$file"
        sed -i 's/(speed)/(_speed)/g' "$file"
        sed -i 's/(duration)/(_duration)/g' "$file"
        sed -i 's/(multiplier)/(_multiplier)/g' "$file"
        sed -i 's/(mode)/(_mode)/g' "$file"
        sed -i 's/(snapshot)/(_snapshot)/g' "$file"
        sed -i 's/(delta)/(_delta)/g' "$file"
        sed -i 's/(maze)/(_maze)/g' "$file"
    fi
done

echo "Done!"
