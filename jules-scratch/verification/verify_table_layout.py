import re
import os
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Add the init script BEFORE navigating
    page.add_init_script("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(handler) {
                        return {
                            withFailureHandler: function(failHandler) {
                                return {
                                    getEmployeeData: function() {
                                        handler({
                                            current: [],
                                            previous: {},
                                            snapshotTimestamp: "2024-01-01",
                                            currentUserEmail: "test@example.com",
                                            canEdit: false,
                                            canApprove: true,
                                            totalApprovedPlantilla: 100,
                                            previousDateString: "2023-12-01",
                                            dropdownListData: {
                                                managers: [],
                                                divisions: [],
                                                jobtitle: [],
                                                level: [],
                                                payrolltype: [],
                                                joblevel: [],
                                                contracttype: [],
                                                competency: [],
                                                status: [],
                                                reasonforleaving: []
                                            }
                                        });
                                    },
                                    getChangeRequests: function() {
                                        handler({ myRequests: [{ "RequestID": "1", "RequestorEmail": "test@example.com", "SubmissionTimestamp": "2024-01-01" }], approvals: [] });
                                    },
                                    checkUserAccess: function() {
                                      handler({ isAuthorized: true, userEmail: "test@example.com" });
                                    },
                                    getUpcomingDues: function() {
                                      handler({ upcoming: [], overdue: [] });
                                    }
                                };
                            }
                        };
                    }
                }
            }
        };
    """)

    # Navigate to the local HTML file
    page.goto(f"file://{os.getcwd()}/Index.html")

    # Bypassing login by directly showing the app view
    page.evaluate("document.getElementById('login-view').style.display = 'none'")
    page.evaluate("document.getElementById('app-view').style.display = 'block'")

    # Hide homepage and show tab area
    page.evaluate("document.getElementById('homepage-view').style.display = 'none'")
    page.evaluate("document.getElementById('tab-area').style.display = 'block'")

    # Set user permissions directly for UI logic
    page.evaluate("userCanApprove = true")
    page.evaluate("userCanEdit = false")


    # Show and click the "My Requests" tab
    page.evaluate("document.getElementById('tab-my-requests').style.display = 'flex'")
    page.click("#tab-my-requests")

    # Wait for the table to be visible
    expect(page.locator("#my-requests-table")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
