import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: (handler) => {
                            const backendFunctions = {
                                checkUserAccess: () => handler({ isAuthorized: true, userEmail: 'test@example.com' }),
                                getEmployeeData: () => handler({
                                    current: [],
                                    previous: {},
                                    snapshotTimestamp: new Date().toISOString(),
                                    currentUserEmail: 'test@example.com',
                                    canEdit: false,
                                    canApprove: false,
                                    dropdownListData: { managers: [], jobtitle: [], level: [] },
                                    totalApprovedPlantilla: 100,
                                    previousDateString: '2023-01-01'
                                }),
                                getUpcomingDues: () => handler({ upcoming: [], overdue: [] }),
                                // THIS IS THE KEY FIX: Provide data for at least one row so the table initializes
                                getChangeRequests: () => handler({
                                    myRequests: [{ "RequestID": "REQ-001", "Status": "Pending" }],
                                    approvals: []
                                }),
                            };
                            const runner = {
                                ...backendFunctions,
                                withFailureHandler: (failureHandler) => backendFunctions
                            };
                            return runner;
                        }
                    }
                },
                charts: {
                    load: () => {},
                    setOnLoadCallback: (cb) => { if (typeof cb === 'function') cb(); },
                    visualization: {
                        OrgChart: function() { return { draw: () => {} }; },
                        DataTable: function() { return { addColumn: () => {}, addRow: () => {} }; },
                    }
                }
            };
        """)

        await page.goto(f"file://{os.path.abspath('Index.html')}")
        await expect(page.locator("#app-view")).to_be_visible(timeout=10000)

        # Navigate to the org chart and then to the "My Requests" tab
        await page.locator("div[onclick=\"navigateToView('org', 'org-chart')\"]").click()
        await page.locator("#tab-my-requests").click()

        # Check that the "Show X entries" dropdown is visible
        entries_dropdown = page.locator("#my-requests-table_length")
        await expect(entries_dropdown).to_be_visible()

        await page.screenshot(path="jules-scratch/verification/verification_entries_dropdown.png")
        await browser.close()

asyncio.run(main())
