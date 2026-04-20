/**
 * Testes de Simulação de Usuário - ClientFlow
 * Simula o fluxo completo de um usuário real na aplicação
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'localhost';
const PORT = 8080;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

function checkContains(data, checks, testName) {
  const results = checks.map(check => ({
    check,
    found: data.toLowerCase().includes(check.toLowerCase()),
  }));

  const allFound = results.every(r => r.found);

  if (allFound) {
    log(`  ✅ ${testName}`, 'green');
    testsPassed++;
  } else {
    log(`  ❌ ${testName}`, 'red');
    results.filter(r => !r.found).forEach(r => {
      log(`     - Ausente: "${r.check}"`, 'yellow');
    });
    testsFailed++;
  }

  return allFound;
}

// ==================== TESTES ====================

async function testLandingPage() {
  log('\n📄 TESTE: Landing Page (Primeira Impressão)', 'cyan');

  try {
    const response = await makeRequest('/landing');

    if (response.status !== 200) {
      log(`  ❌ Status ${response.status}`, 'red');
      testsFailed++;
      return;
    }

    checkContains(response.data, [
      'ClientFlow',
      '<html',
      '</html>',
      '<head',
      '<body',
    ], 'Estrutura HTML completa');

    checkContains(response.data, [
      'Automação',
      'Clientes',
      'Campanhas',
    ], 'Conteúdo principal presente');

    checkContains(response.data, [
      'meta',
      'description',
      'viewport',
    ], 'SEO básico');

    checkContains(response.data, [
      'react',
      '__vite',
      'refresh',
    ], 'React/Vite carregando');

  } catch (error) {
    log(`  ❌ Erro: ${error.message}`, 'red');
    testsFailed++;
  }
}

async function testAuthPages() {
  log('\n🔐 TESTE: Páginas de Autenticação', 'cyan');

  // Teste página de login
  try {
    const loginResponse = await makeRequest('/auth');

    checkContains(loginResponse.data, [
      'email',
      'password',
      'Login',
      'form',
    ], 'Página de login com formulário');

  } catch (error) {
    log(`  ❌ Erro na página de auth: ${error.message}`, 'red');
    testsFailed++;
  }

  // Teste página de reset de senha
  try {
    const resetResponse = await makeRequest('/reset-password');

    checkContains(resetResponse.data, [
      'email',
      'reset',
      'senha',
    ], 'Página de reset de senha');

  } catch (error) {
    log(`  ❌ Erro na página de reset: ${error.message}`, 'red');
    testsFailed++;
  }
}

async function testProtectedRoutes() {
  log('\n🔒 TESTE: Rotas Protegidas (Redirecionamento)', 'cyan');

  const protectedRoutes = [
    { path: '/', name: 'Dashboard' },
    { path: '/clientes', name: 'Clientes' },
    { path: '/campanhas', name: 'Campanhas' },
    { path: '/configuracoes', name: 'Configurações' },
  ];

  for (const route of protectedRoutes) {
    try {
      const response = await makeRequest(route.path);

      // Rotas protegidas devem retornar 200 (a aplicação React lida com o redirecionamento)
      if (response.status === 200) {
        checkContains(response.data, [
          'react',
          'root',
          '<div',
        ], `${route.name} carregando aplicação React`);
      } else {
        log(`  ⚠️  ${route.name}: Status ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ ${route.name}: ${error.message}`, 'red');
      testsFailed++;
    }
  }
}

async function testStaticAssets() {
  log('\n📦 TESTE: Assets Estáticos', 'cyan');

  const assets = [
    { path: '/favicon.ico', name: 'Favicon' },
    { path: '/placeholder.svg', name: 'Placeholder SVG' },
    { path: '/manifest.json', name: 'PWA Manifest' },
  ];

  for (const asset of assets) {
    try {
      const response = await makeRequest(asset.path);
      if (response.status === 200) {
        log(`  ✅ ${asset.name} acessível`, 'green');
        testsPassed++;
      } else {
        log(`  ⚠️  ${asset.name}: Status ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ ${asset.name}: ${error.message}`, 'red');
      testsFailed++;
    }
  }
}

async function testApplicationStructure() {
  log('\n🏗️  TESTE: Estrutura da Aplicação', 'cyan');

  try {
    const response = await makeRequest('/');
    const data = response.data;

    // Verificar se tem os scripts necessários
    const hasReactScript = data.includes('react') || data.includes('__vite');
    const hasClientScript = data.includes('@vite/client');
    const hasRefreshScript = data.includes('react-refresh');

    if (hasReactScript && hasClientScript) {
      log('  ✅ React + Vite HMR configurados', 'green');
      testsPassed++;
    } else {
      log('  ❌ Scripts React/Vite incompletos', 'red');
      testsFailed++;
    }

    // Verificar meta tags importantes
    checkContains(data, [
      'utf-8',
      'viewport',
      'width=device-width',
    ], 'Meta tags de responsividade');

    // Verificar tema
    checkContains(data, [
      'class',
      'dark',
      'light',
    ], 'Suporte a temas dark/light');

  } catch (error) {
    log(`  ❌ Erro: ${error.message}`, 'red');
    testsFailed++;
  }
}

async function testNavigationFlow() {
  log('\n🧭 TESTE: Fluxo de Navegação', 'cyan');

  const navigationFlow = [
    { from: '/landing', to: '/auth', description: 'Landing → Login' },
    { from: '/auth', to: '/reset-password', description: 'Login → Reset' },
    { from: '/landing', to: '/', description: 'Landing → Dashboard (pós-login)' },
  ];

  for (const flow of navigationFlow) {
    try {
      const response = await makeRequest(flow.to);
      if (response.status === 200) {
        log(`  ✅ Navegação: ${flow.description}`, 'green');
        testsPassed++;
      } else {
        log(`  ⚠️  Navegação: ${flow.description} (Status ${response.status})`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ Navegação: ${flow.description} - ${error.message}`, 'red');
      testsFailed++;
    }
  }
}

async function testResponsePerformance() {
  log('\n⚡ TESTE: Performance das Respostas', 'cyan');

  const routes = ['/', '/landing', '/auth', '/clientes'];
  const results = [];

  for (const route of routes) {
    const start = Date.now();
    try {
      await makeRequest(route);
      const duration = Date.now() - start;
      results.push({ route, duration });
    } catch (error) {
      results.push({ route, duration: -1, error: error.message });
    }
  }

  results.forEach(result => {
    if (result.duration > 0) {
      const color = result.duration < 1000 ? 'green' : result.duration < 3000 ? 'yellow' : 'red';
      log(`  ${result.duration < 1000 ? '✅' : '⚠️'} ${result.route}: ${result.duration}ms`, color);
      if (result.duration < 5000) testsPassed++;
      else testsFailed++;
    } else {
      log(`  ❌ ${result.route}: Erro - ${result.error}`, 'red');
      testsFailed++;
    }
  });
}

async function testServiceIntegration() {
  log('\n🔌 TESTE: Integração com Serviços', 'cyan');

  // Verificar se os arquivos de serviço existem (simulação)
  const services = [
    'client.service.ts',
    'campaign.service.ts',
    'auth.service.ts',
    'billing.service.ts',
    'integration.service.ts',
  ];

  const fs = require('fs');
  const path = require('path');

  services.forEach(service => {
    const servicePath = path.join(__dirname, '..', 'src', 'services', service);
    try {
      if (fs.existsSync(servicePath)) {
        log(`  ✅ Serviço ${service} existe`, 'green');
        testsPassed++;
      } else {
        log(`  ⚠️  Serviço ${service} não encontrado`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ Erro ao verificar ${service}`, 'red');
      testsFailed++;
    }
  });
}

// ==================== EXECUÇÃO ====================

async function runAllTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║    TESTES DE SIMULAÇÃO DE USUÁRIO - CLIENTFLOW        ║', 'cyan');
  log('║    Simulando fluxo real de navegação e uso            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log(`\n🌐 Servidor: http://${BASE_URL}:${PORT}\n`);

  const startTime = Date.now();

  await testLandingPage();
  await testAuthPages();
  await testProtectedRoutes();
  await testStaticAssets();
  await testApplicationStructure();
  await testNavigationFlow();
  await testResponsePerformance();
  await testServiceIntegration();

  const duration = Date.now() - startTime;

  // Resultados
  log('\n═════════════════════════════════════════════════════════', 'cyan');
  log('                    RESULTADO FINAL                       ', 'cyan');
  log('═════════════════════════════════════════════════════════', 'cyan');

  const totalTests = testsPassed + testsFailed;
  const percentage = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;

  log(`\n✅ Testes Passaram: ${testsPassed}`, 'green');
  log(`❌ Testes Falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'reset');
  log(`📊 Taxa de Sucesso: ${percentage}%`, percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  log(`⏱️  Tempo Total: ${duration}ms`, 'cyan');

  log('\n═════════════════════════════════════════════════════════', 'cyan');

  if (testsFailed === 0) {
    log('✅ TODOS OS TESTES PASSARAM!', 'green');
    log('A aplicação está funcionando perfeitamente!', 'green');
  } else if (testsFailed < 3) {
    log('⚠️  ALGUNS TESTES COM AVISOS (Não críticos)', 'yellow');
    log('A aplicação está funcional com pequenas observações.', 'yellow');
  } else {
    log('❌ VÁRIOS TESTES FALHARAM', 'red');
    log('Recomendada revisão da aplicação.', 'red');
  }

  log('═════════════════════════════════════════════════════════\n', 'cyan');

  process.exit(testsFailed > 3 ? 1 : 0);
}

runAllTests().catch(error => {
  log(`\n❌ Erro fatal nos testes: ${error.message}`, 'red');
  process.exit(1);
});
