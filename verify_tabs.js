const fs = require('fs');
const { JSDOM } = require('jsdom');

function runTests(userCanEdit, userCanApprove) {
  return new Promise((resolve, reject) => {
    // A more robust mock for google.script.run that handles both direct and chained calls
    const googleScriptRunMock = {
      withSuccessHandler: (handler) => {
        const backendFunctions = {
          checkUserAccess: () => handler({ isAuthorized: true, userEmail: 'test@example.com' }),
          getEmployeeData: () => handler({
            current: [],
            previous: {},
            snapshotTimestamp: new Date().toISOString(),
            currentUserEmail: 'test@example.com',
            canEdit: userCanEdit,
            canApprove: userCanApprove,
            dropdownListData: {},
            totalApprovedPlantilla: 100,
            previousDateString: '2023-01-01'
          }),
          getListsForDropdowns: () => handler({}),
          getUpcomingDues: () => handler({ upcoming: [], overdue: [] }),
          getAnalyticsData: () => handler({ overallHeadcount: 0, totalHeadcount: 0, filteredPositionsCount: 0, statusCounts: {}, contractCounts: {}, genderCounts: {}, jobGroupCounts: {}, losCounts: {}, newHiresByMonth: {}, ageGenerationCounts: {} }),
          getResignationData: () => handler({ filteredResignationsCount: 0, yearlyHiresLeavers: { hires: 0, leavers: 0 }, reasonCounts: {}, resignationGenderCounts: {}, resignationContractCounts: {}, resignationDivisionCounts: {}, resignationJobGroupCounts: {}, monthlyTurnover: [], ytdTurnover: 0, attritionRate: 0, retentionRate: 0 }),
          getChangeRequests: () => handler({ myRequests: [], approvals: [] }),
          testBackendConnection: () => handler("Connection successful!"),
          logUserActivity: () => handler(null), // Mock the logging function
        };

        const runner = {
          ...backendFunctions,
          withFailureHandler: (failureHandler) => {
            return backendFunctions;
          }
        };

        return runner;
      }
    };

    const google = {
      script: { run: googleScriptRunMock },
      charts: {
        load: () => {},
        setOnLoadCallback: (cb) => { if (typeof cb === 'function') cb(); },
        visualization: {
          OrgChart: function() { return { draw: () => {} }; },
          DataTable: function() { return { addColumn: () => {}, addRow: () => {} }; },
        }
      }
    };

    const dom = new JSDOM(fs.readFileSync('Index.html', 'utf8'), {
      runScripts: 'dangerously',
      beforeParse(window) {
        Object.assign(window, { google, alert: () => {}, confirm: () => true });
        window.document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            try {
              const orgCard = window.document.querySelector('div[onclick="navigateToView(\'org\', \'org-chart\')"]');
              if (!orgCard) {
                  throw new Error("Organizational Chart card not found");
              }
              orgCard.click();

              const myRequestsTab = window.document.getElementById('tab-my-requests');
              const approvalsTab = window.document.getElementById('tab-approvals');

              let pass = true;
              let message = '';

              if (!userCanEdit && myRequestsTab.style.display !== 'flex') {
                pass = false;
                message = `FAIL: My Requests tab should be 'flex' for non-edit users, but was '${myRequestsTab.style.display}'.`;
              }

              if (userCanApprove && approvalsTab.style.display !== 'flex') {
                pass = false;
                message = `FAIL: Approvals tab should be 'flex' for approvers, but was '${approvalsTab.style.display}'.`;
              }

              if (userCanEdit && myRequestsTab.style.display !== 'none') {
                pass = false;
                message = `FAIL: My Requests tab should be 'none' for edit users, but was '${myRequestsTab.style.display}'.`;
              }

              if (!userCanApprove && approvalsTab.style.display !== 'none') {
                pass = false;
                message = `FAIL: Approvals tab should be 'none' for non-approvers, but was '${approvalsTab.style.display}'.`;
              }

              if (pass) {
                console.log(`✅ PASS: Correct tabs are visible for user (canEdit: ${userCanEdit}, canApprove: ${userCanApprove})`);
                resolve();
              } else {
                console.error(`❌ ${message}`);
                reject(new Error(message));
              }
            } catch (e) {
              reject(e);
            }
          }, 200);
        });
      }
    });
  });
}

async function main() {
  try {
    console.log("--- Testing Regular User (canEdit: false, canApprove: false) ---");
    await runTests(false, false);

    console.log("\n--- Testing Approver (canEdit: false, canApprove: true) ---");
    await runTests(false, true);

    console.log("\n--- Testing Admin (canEdit: true, canApprove: true) ---");
    await runTests(true, true);

    console.log("\nAll user permission tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\nTests failed.", error.message);
    process.exit(1);
  }
}

main();
