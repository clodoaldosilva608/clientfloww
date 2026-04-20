import { test, expect } from "@playwright/test";

test.describe("ClientFlow Massive Load Performance", () => {
  test("should load the dashboard and clients list under high data load", async ({ page }) => {
    // 1. Acessar a página de login
    await page.goto("/");
    
    // 2. Realizar Login
    await page.fill('input[type="email"]', "clodoaldo608@gmail.com");
    await page.fill('input[type="password"]', "88677488");
    await page.click('button[type="submit"]');

    // 3. Aguardar o Dashboard carregar
    await expect(page).toHaveURL(/.*dashboard/);
    console.log("✅ Dashboard carregado.");

    // 4. Navegar para a lista de clientes
    await page.click('a[href="/clients"]');
    
    // 5. Validar que a lista está visível e contém dados
    const startTime = Date.now();
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar se pelo menos um cliente da carga massiva está lá
    await expect(page.getByText("Mass Test Client")).first().toBeVisible();
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`⏱️ Tempo de carregamento da tabela com dados massivos: ${loadTime}ms`);
    
    // Garantir que carregou em menos de 5 segundos (limite generoso para localdev)
    expect(loadTime).toBeLessThan(5000);
  });
});
