const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to https://clientfloww.vercel.app/ ...');
  await page.goto('https://clientfloww.vercel.app/');
  
  // Wait for React to load
  await page.waitForLoadState('networkidle');
  
  // Get all text content
  const textContent = await page.content();
  
  if (textContent.includes('Hugging Face')) {
    console.log('SUCCESS: Hugging Face text found on the page!');
    
    // Check specific connection strings if possible
    if (textContent.includes('Conectado ao Hugging Face')) {
       console.log('STATUS: Conectado ao Hugging Face (🟢)');
    } else if (textContent.includes('Hugging Face não configurado')) {
       console.log('STATUS: Hugging Face não configurado (🟡)');
    }
  } else {
    console.log('WARNING: Hugging Face text NOT found. Maybe it is under a specific route?');
  }

  // Also check Integracoes page
  console.log('Navigating to Integracoes page...');
  await page.goto('https://clientfloww.vercel.app/integracoes');
  await page.waitForLoadState('networkidle');
  const integrationsContent = await page.content();
  if (integrationsContent.includes('Conectado')) {
    console.log('Integracoes page has "Conectado" state.');
  }

  await browser.close();
})();
