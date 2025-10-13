import asyncio
from playwright.sync_api import sync_playwright, expect
import os
import re

def run_verification(page):
    """
    Navigates to the local Index.html file, simulates a login,
    clicks the 'Recruitment Report' card to show a content-heavy tab,
    and verifies the overall layout padding.
    """
    # 1. Arrange: Go to the local HTML file.
    file_path = os.path.abspath("Index.html")
    page.goto(f"file://{file_path}")

    # 2. Act: Mock the Google Apps Script environment and simulate navigation.
    # The google.script.run object is not available in a local context,
    # so we create a dummy version of it to prevent errors.
    page.evaluate("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: () => ({
                        withFailureHandler: () => ({
                            logUserActivity: () => {},
                            getAnalyticsData: () => {},
                            getResignationData: () => {},
                            getEmployeeMovementData: () => {},
                            initializeMasterlist: () => {},
                            drawPredictiveInsights: () => {},
                            drawHiringPredictions: () => {}
                        })
                    }),
                    logUserActivity: () => {},
                    getAnalyticsData: () => {},
                    getResignationData: () => {},
                    getEmployeeMovementData: () => {},
                    initializeMasterlist: () => {},
                    drawPredictiveInsights: () => {},
                    drawHiringPredictions: () => {}
                }
            }
        };

        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'block';
        navigateToView('reports', 'demographics');
    """)

    # 3. Assert: Check that the main content area, which provides the padding, is visible.
    main_element = page.locator("main")
    expect(main_element).to_be_visible()
    # The padding is applied via Tailwind classes like p-4, sm:p-6, md:p-8.
    # We check for the base padding class to confirm the element is styled correctly.
    expect(main_element).to_have_class(re.compile(r'.*p-4.*'))

    # 4. Screenshot: Capture the final result for visual verification of the layout.
    page.screenshot(path="jules-scratch/verification/layout_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()