/**
 * Utility function to format the earnings value.
 */ 
function formatEarningsAmount(value) {
    if (value === undefined || value < 0 || typeof value !== 'number') {
        return 'N/A';
    }
    // Convert to a string, remove the decimal portion, and then format with a dot after every three digits.
    return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Function to replace the earnings figure on the page
 */
function styleAndUpdateEarnings(earnings) {
    const statAmountH5Elements = document.querySelectorAll('.stat-amount.h5');
    if (!statAmountH5Elements || statAmountH5Elements.length === 0) {
        return;
    }
    statAmountH5Elements.forEach((element, index) => {
        // Update Total earnings text
        if (index === 0) {
            const earningsSpan = element.querySelector('span');
            if (earningsSpan) {
                const formattedEarnings = formatEarningsAmount(earnings);
                earningsSpan.textContent = `$${formattedEarnings}`;
            }
        }
    });
}

/**
 * Utility function to construct the API URL.
 */
function getAPI(freelancerId) {
    if (!freelancerId || typeof freelancerId !== 'string') {
        return;
    }
    return `https://www.upwork.com/freelancers/api/v1/freelancer/profile/${freelancerId}/details`;
}

/**
 * Function to extract the freelancer ID from the current URL.
 */
function extractFreelancerID() {
    const pathParts = window.location.pathname.split('/');
    const freelancerSegmentIndex = pathParts?.findIndex(segment => segment?.toLowerCase() === 'freelancers');
    if (freelancerSegmentIndex > -1 && pathParts.length > freelancerSegmentIndex + 1) {
        const freelancerID = pathParts[freelancerSegmentIndex + 1];
        // The ID starts with '~'.
        if (freelancerID.startsWith('~')) {
            return freelancerID; 
        }
    }
}

/**
 * Fetch and replace earnings data if on the freelancer page
 */
function fetchAndDisplayEarnings() {
    // Early return if not on the freelancer page or ID doesn't exist
    const freelancerID = extractFreelancerID();
    if (!freelancerID) {
        return;
    }
    // Construct the API URL with dynamic freelancer ID
    const API = getAPI(freelancerID);
    // Fetch the data from the API
    fetch(API)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch profile data.');
            }
            return response.json();
        })
        .then(data => {
            const totalEarningsNumValue = data?.profile?.stats?.totalEarningsNumValue;
            if (totalEarningsNumValue === undefined || typeof totalEarningsNumValue !== 'number') {
                return;
            }
            styleAndUpdateEarnings(totalEarningsNumValue);
        })
        .catch(error => console.error('Error fetching and displaying earnings:', error));
}
// Call the function to fetch and display earnings
fetchAndDisplayEarnings();
