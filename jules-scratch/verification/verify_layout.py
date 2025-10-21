
import os
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Directly injects the table and takes a screenshot to verify the layout.
    """
    page.goto("file://" + os.path.abspath("Index.html"))

    # Directly manipulate the DOM and define the mock right before using it.
    page.evaluate("""() => {
        // 1. Define the mock for google.script.run
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(callback) {
                        this._success = callback;
                        return this;
                    },
                    withFailureHandler: function(callback) {
                        this._failure = callback;
                        return this;
                    },
                    getChangeRequests: function() {
                        if (this._success) {
                            this._success({
                                myRequests: [{
                                    "RequestID": "REQ-001", "SubmissionTimestamp": "2023-10-27",
                                    "Status": "Pending", "RequestType": "Promotion",
                                    "EmployeeName": "John Doe"
                                }],
                                approvals: []
                            });
                        }
                    }
                }
            }
        };

        // 2. Set up the UI state
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'block';
        document.getElementById('homepage-view').style.display = 'none';
        document.getElementById('tab-area').style.display = 'block';
        document.getElementById('my-requests-view').classList.add('active');
        document.getElementById('tab-my-requests').classList.add('active');

        // 3. Manually call the function that draws the table.
        drawMyRequestsTable();
    }""")

    # Wait for the length menu to be visible
    expect(page.locator(".dataTables_length")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
