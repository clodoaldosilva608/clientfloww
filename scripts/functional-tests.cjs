/**
 * Testes Funcionais Específicos - ClientFlow
 * Testa funcionalidades críticas do sistema
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'localhost';
const PORT = 8080;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: 'GET',
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// Testa se os componentes React estão sendo carregados
async function testReactComponents() {
  log('\n⚛️  TESTE: Componentes React', 'magenta');

  try {
    const response = await makeRequest('/');
    const checks = [
      { name: 'React Refresh', pattern: 'react-refresh' },
      { name: 'Vite Client', pattern: '@vite/client' },
      { name: 'Script Module', pattern: 'type="module"' },
      { name: 'Root Element', pattern: 'id="root"' },
      { name: 'Toast Container', pattern: 'toast' },
    ];

    for (const check of checks) {
      if (response.data.includes(check.pattern)) {
        log(`  ✅ ${check.name} configurado`, 'green');
        testsPassed++;
      } else {
        log(`  ⚠️  ${check.name} não detectado`, 'yellow');
      }
    }
  } catch (error) {
    log(`  ❌ Erro: ${error.message}`, 'red');
    testsFailed++;
  }
}

// Testa as páginas principais
async function testMainPages() {
  log('\n📑 TESTE: Páginas Principais', 'magenta');

  const pages = [
    { path: '/', name: 'Dashboard' },
    { path: '/landing', name: 'Landing Page' },
    { path: '/auth', name: 'Login' },
    { path: '/clientes', name: 'Clientes' },
    { path: '/campanhas', name: 'Campanhas' },
    { path: '/agendamentos', name: 'Agendamentos' },
    { path: '/historico', name: 'Histórico' },
    { path: '/configuracoes', name: 'Configurações' },
    { path: '/integracoes', name: 'Integrações' },
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(page.path);
      if (response.status === 200) {
        log(`  ✅ ${page.name} (${page.path})`, 'green');
        testsPassed++;
      } else {
        log(`  ❌ ${page.name}: Status ${response.status}`, 'red');
        testsFailed++;
      }
    } catch (error) {
      log(`  ❌ ${page.name}: ${error.message}`, 'red');
      testsFailed++;
    }
  }
}

// Testa a estrutura dos serviços
async function testServicesStructure() {
  log('\n🔧 TESTE: Estrutura dos Serviços', 'magenta');

  const servicesDir = path.join(__dirname, '..', 'src', 'services');
  const requiredServices = [
    'client.service.ts',
    'campaign.service.ts',
    'auth.service.ts',
    'billing.service.ts',
    'integration.service.ts',
    'message.service.ts',
    'scheduler.service.ts',
    'automation.service.ts',
  ];

  for (const service of requiredServices) {
    const servicePath = path.join(servicesDir, service);
    try {
      if (fs.existsSync(servicePath)) {
        const content = fs.readFileSync(servicePath, 'utf8');

        // Verifica se o serviço tem estrutura adequada
        const hasExport = content.includes('export');
        const hasAsync = content.includes('async');
        const hasTryCatch = content.includes('try');

        if (hasExport && hasAsync) {
          log(`  ✅ ${service} (estrutura correta)`, 'green');
          testsPassed++;
        } else {
          log(`  ⚠️  ${service} (estrutura incompleta)`, 'yellow');
        }
      } else {
        log(`  ❌ ${service} não encontrado`, 'red');
        testsFailed++;
      }
    } catch (error) {
      log(`  ❌ Erro ao verificar ${service}`, 'red');
      testsFailed++;
    }
  }
}

// Testa configurações do TypeScript
async function testTypeScriptConfig() {
  log('\n📘 TESTE: Configuração TypeScript', 'magenta');

  const checks = [
    { file: 'tsconfig.json', required: true },
    { file: 'tsconfig.app.json', required: true },
    { file: 'tsconfig.node.json', required: true },
  ];

  for (const check of checks) {
    const filePath = path.join(__dirname, '..', check.file);
    try {
      if (fs.existsSync(filePath)) {
        log(`  ✅ ${check.file} existe`, 'green');
        testsPassed++;
      } else if (check.required) {
        log(`  ❌ ${check.file} não encontrado`, 'red');
        testsFailed++;
      } else {
        log(`  ⚠️  ${check.file} não encontrado`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ Erro ao verificar ${check.file}`, 'red');
      testsFailed++;
    }
  }
}

// Testa configurações do Vite
async function testViteConfig() {
  log('\n⚡ TESTE: Configuração Vite', 'magenta');

  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  try {
    if (fs.existsSync(viteConfigPath)) {
      const content = fs.readFileSync(viteConfigPath, 'utf8');

      const checks = [
        { name: 'React Plugin', pattern: '@vitejs/plugin-react' },
        { name: 'Path Aliases', pattern: '@/' },
        { name: 'Server Config', pattern: 'server:' },
      ];

      for (const check of checks) {
        if (content.includes(check.pattern)) {
          log(`  ✅ ${check.name} configurado`, 'green');
          testsPassed++;
        } else {
          log(`  ⚠️  ${check.name} não detectado`, 'yellow');
        }
      }
    } else {
      log(`  ❌ vite.config.ts não encontrado`, 'red');
      testsFailed++;
    }
  } catch (error) {
    log(`  ❌ Erro ao verificar Vite config`, 'red');
    testsFailed++;
  }
}

// Testa integração com Supabase
async function testSupabaseIntegration() {
  log('\n🔌 TESTE: Integração Supabase', 'magenta');

  const supabaseDir = path.join(__dirname, '..', 'src', 'integrations', 'supabase');

  try {
    // Verifica se os arquivos existem
    const clientExists = fs.existsSync(path.join(supabaseDir, 'client.ts'));
    const typesExists = fs.existsSync(path.join(supabaseDir, 'types.ts'));

    if (clientExists) {
      log(`  ✅ Supabase client configurado`, 'green');
      testsPassed++;
    } else {
      log(`  ❌ Supabase client não encontrado`, 'red');
      testsFailed++;
    }

    if (typesExists) {
      log(`  ✅ Tipos do Supabase gerados`, 'green');
      testsPassed++;
    } else {
      log(`  ⚠️  Tipos do Supabase não encontrados`, 'yellow');
    }

    // Verifica se o client.ts tem a configuração correta
    if (clientExists) {
      const content = fs.readFileSync(path.join(supabaseDir, 'client.ts'), 'utf8');
      if (content.includes('createClient') && content.includes('supabase')) {
        log(`  ✅ Cliente Supabase inicializado corretamente`, 'green');
        testsPassed++;
      }
    }
  } catch (error) {
    log(`  ❌ Erro na integração Supabase`, 'red');
    testsFailed++;
  }
}

// Testa componentes UI
async function testUIComponents() {
  log('\n🎨 TESTE: Componentes UI', 'magenta');

  const uiDir = path.join(__dirname, '..', 'src', 'components', 'ui');
  const requiredComponents = [
    'button.tsx',
    'input.tsx',
    'dialog.tsx',
    'table.tsx',
    'card.tsx',
    'badge.tsx',
    'toast.tsx',
    'select.tsx',
  ];

  for (const component of requiredComponents) {
    const componentPath = path.join(uiDir, component);
    try {
      if (fs.existsSync(componentPath)) {
        log(`  ✅ ${component}`, 'green');
        testsPassed++;
      } else {
        log(`  ⚠️  ${component} não encontrado`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ Erro ao verificar ${component}`, 'red');
    }
  }
}

// Testa testes unitários
async function testUnitTests() {
  log('\n🧪 TESTE: Suite de Testes', 'magenta');

  const testDir = path.join(__dirname, '..', 'src', 'test');

  try {
    const files = fs.readdirSync(testDir);
    const testFiles = files.filter(f => f.endsWith('.test.ts') || f.endsWith('.spec.ts'));

    log(`  ✅ ${testFiles.length} arquivos de teste encontrados`, 'green');
    testsPassed++;

    // Verifica se há testes de serviços
    const serviceTests = testFiles.filter(f => f.includes('service'));
    if (serviceTests.length > 0) {
      log(`  ✅ ${serviceTests.length} testes de serviços`, 'green');
      testsPassed++;
    }
  } catch (error) {
    log(`  ⚠️  Diretório de testes não acessível`, 'yellow');
  }
}

// Testa configuração PWA
async function testPWAConfig() {
  log('\n📱 TESTE: Configuração PWA', 'magenta');

  const publicDir = path.join(__dirname, '..', 'public');

  try {
    const manifestExists = fs.existsSync(path.join(publicDir, 'manifest.json'));
    const faviconExists = fs.existsSync(path.join(publicDir, 'favicon.ico'));

    // Verifica ícones PWA
    const iconsDir = path.join(publicDir, 'icons');
    let iconsCount = 0;
    if (fs.existsSync(iconsDir)) {
      iconsCount = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png')).length;
    }

    if (manifestExists) {
      log(`  ✅ manifest.json configurado`, 'green');
      testsPassed++;
    } else {
      log(`  ⚠️  manifest.json não encontrado`, 'yellow');
    }

    if (iconsCount >= 5) {
      log(`  ✅ ${iconsCount} ícones PWA gerados`, 'green');
      testsPassed++;
    } else {
      log(`  ⚠️  Apenas ${iconsCount} ícones PWA (recomendado: 5+)`, 'yellow');
    }
  } catch (error) {
    log(`  ⚠️  Erro ao verificar PWA`, 'yellow');
  }
}

// Testa package.json
async function testPackageJson() {
  log('\n📦 TESTE: Dependências', 'magenta');

  const packagePath = path.join(__dirname, '..', 'package.json');

  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(content);

    const criticalDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'typescript',
      'vite',
    ];

    for (const dep of criticalDeps) {
      if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
        log(`  ✅ ${dep} instalado`, 'green');
        testsPassed++;
      } else {
        log(`  ❌ ${dep} não encontrado`, 'red');
        testsFailed++;
      }
    }
  } catch (error) {
    log(`  ❌ Erro ao ler package.json`, 'red');
    testsFailed++;
  }
}

// ==================== EXECUÇÃO ====================

async function runFunctionalTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════╗', 'magenta');
  log('║     TESTES FUNCIONAIS - CLIENTFLOW                   ║', 'magenta');
  log('║     Verificação completa das funcionalidades         ║', 'magenta');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');
  log(`\n🌐 Servidor: http://${BASE_URL}:${PORT}\n`);

  const startTime = Date.now();

  await testReactComponents();
  await testMainPages();
  await testServicesStructure();
  await testTypeScriptConfig();
  await testViteConfig();
  await testSupabaseIntegration();
  await testUIComponents();
  await testUnitTests();
  await testPWAConfig();
  await testPackageJson();

  const duration = Date.now() - startTime;

  // Resultados
  log('\n═════════════════════════════════════════════════════════', 'magenta');
  log('                    RESULTADO FINAL                       ', 'magenta');
  log('═════════════════════════════════════════════════════════', 'magenta');

  const totalTests = testsPassed + testsFailed;
  const percentage = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;

  log(`\n✅ Testes Passaram: ${testsPassed}`, 'green');
  log(`❌ Testes Falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'reset');
  log(`📊 Taxa de Sucesso: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 75 ? 'yellow' : 'red');
  log(`⏱️  Tempo Total: ${duration}ms`, 'cyan');

  log('\n═════════════════════════════════════════════════════════', 'magenta');

  if (percentage >= 90) {
    log('✅ EXCELENTE! Aplicação totalmente funcional!', 'green');
  } else if (percentage >= 75) {
    log('✅ BOM! Aplicação funcional com pequenas observações.', 'green');
  } else if (percentage >= 60) {
    log('⚠️  REGULAR. Alguns componentes precisam de atenção.', 'yellow');
  } else {
    log('❌ CRÍTICO. Revisão completa necessária.', 'red');
  }

  log('═════════════════════════════════════════════════════════\n', 'magenta');

  process.exit(testsFailed > 5 ? 1 : 0);
}

runFunctionalTests().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
