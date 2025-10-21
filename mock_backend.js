
// A more robust mock for the google.script.run object
window.google = {
    charts: {
        load: (pkg, options) => {},
        setOnLoadCallback: (callback) => {
            // The app calls this, so we need to make sure the callback fires
            // to start the data fetching process.
            setTimeout(callback, 100);
        }
    },
    script: {
        run: (function() {
            let successCallback = null;
            let failureCallback = null;
            let lastFunctionCalled = '';

            // This object will be returned by all function calls, allowing chaining
            const runner = {
                withSuccessHandler: function(callback) {
                    successCallback = callback;
                    return this;
                },
                withFailureHandler: function(callback) {
                    failureCallback = callback;
                    return this;
                }
            };

            // This is the proxy that will intercept all function calls to `run`
            return new Proxy(runner, {
                get: function(target, prop, receiver) {
                    // If the property is one of the handlers, return it
                    if (prop === 'withSuccessHandler' || prop === 'withFailureHandler') {
                        return target[prop];
                    }

                    // Otherwise, we assume it's a backend function call
                    return function(...args) {
                        lastFunctionCalled = prop;

                        // Immediately try to execute the callback with mock data
                        setTimeout(() => {
                            if (successCallback) {
                                let mockData;
                                if (lastFunctionCalled === 'checkUserAccess') {
                                    mockData = { isAuthorized: true, userEmail: 'test@example.com' };
                                } else if (lastFunctionCalled === 'getEmployeeData') {
                                    mockData = {
                                        current: [],
                                        previous: {},
                                        snapshotTimestamp: new Date().toISOString(),
                                        currentUserEmail: 'test@example.com',
                                        canEdit: true,
                                        canApprove: true,
                                        totalApprovedPlantilla: 100,
                                        previousDateString: '2023-01-01',
                                        dropdownListData: {
                                            joblevel: ['JL1', 'JL2'],
                                            divisions: ['Division A'],
                                            departments: ['Dept X']
                                        }
                                    };
                                } else if (lastFunctionCalled === 'getUpcomingDues') {
                                    mockData = { upcoming: [], overdue: [] };
                                } else if (lastFunctionCalled === 'getMasterlistData') {
                                    mockData = {
                                        headers: ['ID', 'Name', 'Role', 'Department'],
                                        rows: [['1', 'John Doe', 'Dev', 'Eng'], ['2', 'Jane Smith', 'PM', 'Product']]
                                    };
                                }

                                successCallback(mockData);
                            }
                            // Reset callbacks for the next call
                            successCallback = null;
                            failureCallback = null;
                        }, 50); // Small delay to simulate async

                        return receiver; // Return the proxy to allow chaining
                    };
                }
            });
        })()
    }
};
