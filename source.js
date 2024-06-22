import CONST from './CONST.js';
let CACHED_EARNINGS;

/**
 * Utility function to format the earnings value.
 */ 
function formatEarningsAmount(value) {
    if (value === undefined || value < 0 || typeof value !== CONST.TYPE.NUMBER) {
        console.info('[formatEarningsAmount] -> N/A: Invalid value: ', value);
        return CONST.STRING.NA;
    }
    // Convert to a string, remove the decimal portion, and then format with a dot after every three digits.
    const formatEarnings = value.toFixed(0).replace(CONST.REGEX.FORMAT_AMOUNT, CONST.SYMBOL.DOT);
    console.info('[formatEarningsAmount] -> formatEarnings: ', formatEarnings);
    return formatEarnings;
}

function updateElements(elements, value, from = '') {
    if (!elements || elements.length === 0) {
        setTimeout(() => {
            document.querySelectorAll(CONST.CLASS.STAT_AMOUNT).forEach((element, index) => {
                // Update Total earnings text
                if (index === 0) {
                    const earningsSpan = element.querySelector(CONST.ELEMENT.SPAN);
                    if (!earningsSpan) {
                        console.info(`[${from} -> updateElements] -> early: Undefined earningsSpan: `, earningsSpan);
                        return;
                    }
                    console.info(`[${from} -> updateElements]: Elements updated successfully.`);
                    earningsSpan.textContent = `${CONST.SYMBOL.DOLLAR}${value}`;
                }
            });
        }, CONST.VALUE.POLL_INTERVAL);
        return;
    }

    elements.forEach((element, index) => {
        // Update Total earnings text
        if (index === 0) {
            const earningsSpan = element.querySelector(CONST.ELEMENT.SPAN);
            if (!earningsSpan) {
                console.info('[updateElements] -> early: Undefined earningsSpan: ', earningsSpan);
                return;
            }
            console.info('[updateElements]: Elements updated successfully.');
            earningsSpan.textContent = `${CONST.SYMBOL.DOLLAR}${value}`;
        }
    });
}

/**
 * Function to replace the earnings figure on the page
 * @returns {boolean} Returns boolean indicating if the earnings were updated successfully.
 */
function styleAndUpdateEarnings(earnings, resizeUpdate = false) {
    const formattedEarnings = formatEarningsAmount(earnings);
    const statAmountH5Elements = document.querySelectorAll(CONST.CLASS.STAT_AMOUNT);

    if (resizeUpdate && statAmountH5Elements && statAmountH5Elements.length > 0) {
        updateElements(undefined, formattedEarnings, CONST.STRING.RESIZE);
        return true;
    }

    if (!statAmountH5Elements || statAmountH5Elements.length === 0) {
        console.info('[styleAndUpdateEarnings] -> false: Invalid elements: ', statAmountH5Elements);
        return false;
    }

    updateElements(statAmountH5Elements, formattedEarnings);
    return true;
}

/**
 * Utility function to construct the API URL.
 */
function getAPI(freelancerID) {
    if (!freelancerID || typeof freelancerID !== CONST.TYPE.STRING) {
        console.info('[getAPI] -> early: Invalid freelancerID: ', freelancerID);
        return;
    }
    return `https://www.upwork.com/freelancers/api/v1/freelancer/profile/${freelancerID}/details`;
}

/**
 * Function to extract the freelancerID from the current URL.
 */
function extractFreelancerID() {
    const pathParts = window.location.pathname.split(CONST.SYMBOL.SLASH);
    const freelancerSegmentIndex = pathParts?.findIndex(segment => segment?.toLowerCase() === CONST.STRING.FREELANCERS);
    if (freelancerSegmentIndex > -1 && pathParts.length > freelancerSegmentIndex + 1) {
        const freelancerID = pathParts[freelancerSegmentIndex + 1];
        // The ID starts with '~'.
        if (freelancerID.startsWith(CONST.SYMBOL.TILDE)) {
            console.info('[extractFreelancerID] -> freelancerID: ', freelancerID);
            return freelancerID; 
        }
        console.info('[extractFreelancerID] -> Invalid freelancerID: ', freelancerID);
    }
}

/**
 * Fetch and replace earnings data if on the freelancer page
 */
function fetchAndDisplayEarnings() {
    // Early return if not on the freelancer page or ID doesn't exist
    const freelancerID = extractFreelancerID();
    if (!freelancerID) {
        console.info('[fetchAndDisplayEarnings] -> Invalid freelancerID: ', freelancerID);
        return;
    }
    // Construct the API URL with dynamic freelancer ID
    const API = getAPI(freelancerID);
    // Fetch the data from the API
    fetch(API)
        .then(response => {
            if (!response.ok) {
                console.info('[fetchAndDisplayEarnings] -> Response NOK: ', response);
                throw new Error('Failed to fetch profile data.');
            }
            return response.json();
        })
        .then(data => {
            CACHED_EARNINGS = data?.profile?.stats?.totalEarningsNumValue;
            console.info('[fetchAndDisplayEarnings] -> Response OK: ', data);
            if (!CACHED_EARNINGS || typeof CACHED_EARNINGS !== CONST.TYPE.NUMBER) {
                console.info('[fetchAndDisplayEarnings] -> Invalid CACHED_EARNINGS: ', CACHED_EARNINGS);
                return;
            }

            let attempts = 0;
            const intervalID = setInterval(() => {
                attempts++;
                console.info('[fetchAndDisplayEarnings] -> Polling count: ', attempts);
                const isUpdated = styleAndUpdateEarnings(CACHED_EARNINGS);
                if (isUpdated || attempts >= CONST.VALUE.MAX_ATTEMPTS) {
                    console.info('[fetchAndDisplayEarnings] -> Polling complete.');
                    clearInterval(intervalID);
                }
            }, CONST.VALUE.POLL_INTERVAL);
        })
        .catch(error => console.warn('Error fetching and displaying earnings:', error));
}

// Event listener to handle window resize
window.addEventListener('resize', resizeEvent => {
    console.info('[WINDOW-RESIZE] -> resizeEvent: ', resizeEvent);
    // check if CACHED_EARNINGS 
    if (!CACHED_EARNINGS) {
        console.info('[WINDOW-RESIZE] -> early: No cached earnings.');
        return;
    }
    console.info('[WINDOW-RESIZE -> styleAndUpdateEarnings]: ', CACHED_EARNINGS);
    styleAndUpdateEarnings(CACHED_EARNINGS, CONST.VALUE.SHOULD_UPDATE_EARNINGS);
});

// Call the function to fetch and display earnings
fetchAndDisplayEarnings();
