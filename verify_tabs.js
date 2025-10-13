const fs = require('fs');
const { JSDOM } = require('jsdom');

// Mock the google object completely, including script.run and charts
const google = {
  script: {
    run: {
      withSuccessHandler: (handler) => {
        return {
          withFailureHandler: (failureHandler) => {
            // Mock all backend functions
            return {
              checkUserAccess: () => handler({ isAuthorized: true, userEmail: 'test@example.com' }),
              getEmployeeData: () => handler({ current: [], previous: {}, snapshotTimestamp: new Date().toISOString(), currentUserEmail: 'test@example.com', canEdit: true, totalApprovedPlantilla: 100, previousDateString: '2023-01-01' }),
              getListsForDropdowns: () => handler({}),
              getUpcomingDues: () => handler({ upcoming: [], overdue: [] }),
              getAnalyticsData: () => handler({ overallHeadcount: 0, totalHeadcount: 0, filteredPositionsCount: 0, statusCounts: {}, contractCounts: {}, genderCounts: {}, jobGroupCounts: {}, losCounts: {}, newHiresByMonth: {}, ageGenerationCounts: {} }),
              getResignationData: () => handler({ filteredResignationsCount: 0, yearlyHiresLeavers: { hires: 0, leavers: 0 }, reasonCounts: {}, resignationGenderCounts: {}, resignationContractCounts: {}, resignationDivisionCounts: {}, resignationJobGroupCounts: {}, monthlyTurnover: [], ytdTurnover: 0, attritionRate: 0, retentionRate: 0 }),
            };
          }
        };
      }
    }
  },
  charts: {
    load: () => {},
    setOnLoadCallback: (cb) => {
      if (typeof cb === 'function') {
        cb();
      }
    },
    visualization: {
      OrgChart: function() { return { draw: () => {} }; },
      DataTable: function() { return { addColumn: () => {}, addRow: () => {} }; },
      arrayToDataTable: () => {},
      PieChart: function() { return { draw: () => {} }; },
      ColumnChart: function() { return { draw: () => {} }; },
      ComboChart: function() { return { draw: () => {} }; },
    }
  }
};

// Mock other global objects that are not available in Node.js
const mocks = {
  google: google,
  alert: () => {},
  confirm: () => true,
};

// Read the HTML file
const html = fs.readFileSync('Index.html', 'utf8');

// Create a JSDOM environment
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  beforeParse(window) {
    // Inject the mocks into the window object
    Object.assign(window, mocks);
  }
});

const { window } = dom;
const { document } = window;

// Helper function to check test results
function check(description, condition) {
  if (condition) {
    console.log(`✅ PASS: ${description}`);
  } else {
    console.error(`❌ FAIL: ${description}`);
    process.exit(1); // Exit with error
  }
}

// --- Test Execution ---
try {
    // 1. Simulate clicking the "Recruitment Report" card
    const recruitmentCard = document.querySelector('div[onclick="navigateToView(\'reports\', \'demographics\')"]');
    check("Recruitment card should exist", recruitmentCard);
    recruitmentCard.click();

    // 2. Check that the tab area is now visible
    const tabArea = document.getElementById('tab-area');
    check("Tab area should be visible after card click", tabArea.style.display === 'block');

    // 3. Check that the homepage is hidden
    const homepage = document.getElementById('homepage-view');
    check("Homepage should be hidden after card click", homepage.style.display === 'none');

    // 4. Simulate clicking the "Resignation" tab
    const resignationTab = document.getElementById('tab-resignation');
    check("Resignation tab should exist", resignationTab);
    resignationTab.click();

    // 5. Check if the resignation tab is now active
    check("Resignation tab should have 'active' class", resignationTab.classList.contains('active'));

    // 6. Check if the resignation content is visible
    const resignationView = document.getElementById('resignation-view');
    check("Resignation content should be visible", resignationView.classList.contains('active'));

    // 7. Check if the demographics content is hidden
    const demographicsView = document.getElementById('demographics-view');
    check("Demographics content should be hidden", !demographicsView.classList.contains('active'));

    console.log("\nAll tab navigation tests passed!");

} catch (error) {
    console.error("An error occurred during verification:", error);
    process.exit(1);
}