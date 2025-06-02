import { createServer } from 'vite';
import path from 'path';

async function testVite() {
  try {
    console.log('Current working directory:', process.cwd());
    console.log('Client directory exists:', require('fs').existsSync('./client'));
    console.log('Main.tsx exists:', require('fs').existsSync('./client/src/main.tsx'));
    
    const clientRoot = path.resolve(process.cwd(), 'client');
    console.log('Resolved client root:', clientRoot);
    console.log('Client root exists:', require('fs').existsSync(clientRoot));
    
    const mainFile = path.resolve(clientRoot, 'src/main.tsx');
    console.log('Resolved main file path:', mainFile);
    console.log('Main file exists:', require('fs').existsSync(mainFile));
    
    const vite = await createServer({
      root: clientRoot,
      configFile: false,
      server: { middlewareMode: true }
    });
    
    console.log('Vite server created successfully');
    await vite.close();
    
  } catch (error) {
    console.error('Vite test failed:', error.message);
  }
}

testVite();