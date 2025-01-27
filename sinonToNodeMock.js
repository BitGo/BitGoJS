const fs = require('fs');
const path = require('path');

function convertSinonToNodeMock(inputFile) {
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    
    // First find all stub declarations
    const stubPattern = /const\s+(\w+)\s*=\s*sandBox\.stub\(([^,]+),\s*['"]([^'"]+)['"]\s*(?:as\s+keyof\s+\w+)?\);/g;
    
    // Keep track of all stubs we find
    const stubs = new Map();
    let match;
    while ((match = stubPattern.exec(content)) !== null) {
      console.log(`Found stub declaration for: ${match[1]}`);
      stubs.set(match[1], {
        varName: match[1],
        prototype: match[2],
        method: match[3],
        fullMatch: match[0]
      });
    }

    let convertedContent = content;

    // Then find and process all withArgs/resolves calls
    for (const [varName, stubInfo] of stubs) {
      const withArgsPattern = new RegExp(`${varName}\\.withArgs\\(([^)]+)\\)\\.resolves\\(([^)]+)\\);`, 'g');
      
      while ((match = withArgsPattern.exec(content)) !== null) {
        const args = match[1];
        const resolveValue = match[2];
        
        // Create the replacement
        const fullPattern = new RegExp(`${stubInfo.fullMatch}[\\s\\S]*?${match[0]}`);
        // Split args by comma and trim each argument
        const argList = args.split(',').map(arg => arg.trim());
        // Create parameter names (x1, x2, etc.)
        const paramNames = argList.map((_, index) => `x${index + 1}`);
        
        // Create the condition comparing each parameter to its corresponding argument
        const conditions = argList.map((arg, index) => `${paramNames[index]} === ${arg}`).join(' && ');
        
        const replacement = `mock.method(${stubInfo.prototype} as any, '${stubInfo.method}', async (${paramNames.join(', ')}) => {
    if (${conditions}) {
      return ${resolveValue};
    }
  });`;

        console.log(`Converting withArgs/resolves for: ${varName}`);
        console.log(`  Arguments: ${args}`);
        console.log(`  Return value: ${resolveValue}`);
        convertedContent = convertedContent.replace(fullPattern, replacement);
      }
    }

    // Write the converted content back to the file
    fs.writeFileSync(inputFile, convertedContent, 'utf8');
    console.log(`Converted Sinon mocks to Node.js mocks in file: ${inputFile}`);
  } catch (err) {
    console.error(`Error processing file ${inputFile}:`, err);
  }
}

// Get the file path from the command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.log('Please provide a file path as an argument.');
  process.exit(1);
}

convertSinonToNodeMock(filePath);
