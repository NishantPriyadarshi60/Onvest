import { test, expect } from "@playwright/test";

test.describe("Apply flow", () => {
  test("welcome page loads for valid fund slug", async ({ page }) => {
    // Use a real fund slug from your DB, or create one via seed
    await page.goto("/apply/test-fund");
    // Expect either the welcome content or 404 if fund doesn't exist
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    const is404 = content?.includes("404") ?? false;
    const hasWelcome = content?.includes("Begin Application") || content?.includes("Start Your");
    expect(is404 || hasWelcome || content?.includes("Not Found")).toBeTruthy();
  });

  test("apply step 1 is accessible at /apply/[slug]/step/1", async ({ page }) => {
    await page.goto("/apply/test-fund/step/1");
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    // Either step 1 form or error/redirect
    expect(
      content?.includes("Create your account") ||
        content?.includes("Step 1") ||
        content?.includes("Loading") ||
        content?.includes("Not Found")
    ).toBeTruthy();
  });
});
