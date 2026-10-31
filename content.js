let CACHED_EARNINGS;

const CONST = {
    ELEMENT: {
        SPAN: 'span'
    },
    CLASS: {
        STAT_AMOUNT: '.stat-amount.h5'
    },
    TYPE: {
        NUMBER: 'number',
        STRING: 'string'
    },
    REGEX: {
        FORMAT_AMOUNT: /\B(?=(\d{3})+(?!\d))/g
    },
    STRING: {
        NA: 'N/A',
        FREELANCERS: 'freelancers'
    },
    VALUE: {
        MAX_ATTEMPTS: 10,
        POLL_INTERVAL: 1000,
        SHOULD_UPDATE_EARNINGS: true
    },
    SYMBOL: {
        DOT: '.',
        SLASH: '/',
        TILDE: '~',
        DOLLAR: '$'
    },
    API: {
        GRAPHQL_URL: 'https://www.upwork.com/api/graphql/v1?alias=getDetails',
        // Only request the fields we need from the talent profile.
        GET_EARNINGS_QUERY: `query GetTalentProfile($profileUrl: String, $viewerMode: Boolean) {
            talentVPDAuthProfile(filter: { profileUrl: $profileUrl, viewerMode: $viewerMode, excludePortfolio: true, excludeAgencies: false }) {
                identity { ciphertext }
                stats { totalEarnings }
                hideEarnings
            }
        }`,
    },
    COOKIE: {
        // Upwork's profile app reads talent profiles with a token from a `<hash>sb` cookie
        PROFILE_TOKEN_SUFFIX: 'sb',
        GLOBAL_TOKEN: 'oauth2_global_js_token'
    },
    // Must match the value in background.js
    MESSAGE_TYPE: {
        GET_AUTH: 'GET_AUTH'
    },
};

/**
 * Utility function to format the earnings value.
 */
function formatEarningsAmount(value) {
    if (value === undefined || value < 0 || typeof value !== CONST.TYPE.NUMBER) {
        return CONST.STRING.NA;
    }
    // Convert to a string, remove the decimal portion, and then format with a dot after every three digits.
    const formatEarnings = value.toFixed(0).replace(CONST.REGEX.FORMAT_AMOUNT, CONST.SYMBOL.DOT);
    return formatEarnings;
}

function updateElements(elements, value) {
    if (!elements || elements.length === 0) {
        setTimeout(() => {
            document.querySelectorAll(CONST.CLASS.STAT_AMOUNT).forEach((element, index) => {
                // Update Total earnings text
                if (index === 0) {
                    const earningsSpan = element.querySelector(CONST.ELEMENT.SPAN);
                    if (!earningsSpan) {
                        return;
                    }
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
                return;
            }
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
        updateElements(undefined, formattedEarnings);
        return true;
    }

    if (!statAmountH5Elements || statAmountH5Elements.length === 0) {
        return false;
    }

    updateElements(statAmountH5Elements, formattedEarnings);
    return true;
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
            return freelancerID;
        }
    }
}

/**
 * Utility function to construct the GraphQL request options.
 */
function getRequestOptions(freelancerID, token, tenantID) {
    const headers = {
        'accept': '*/*',
        'content-type': 'application/json',
        'authorization': `bearer ${token}`,
        'x-upwork-accept-language': 'en-US'
    };
    if (tenantID) {
        headers['x-upwork-api-tenantid'] = tenantID;
    }
    return {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
            query: CONST.API.GET_EARNINGS_QUERY,
            variables: { profileUrl: freelancerID, viewerMode: false }
        })
    };
}

/**
 * Utility function to order tokens by how likely they are to have the profile scopes:
 * `<hash>sb` cookies first, the global token (which lacks profile scopes) last.
 */
function sortTokens(tokens) {
    const rank = token => {
        if (token.name.endsWith(CONST.COOKIE.PROFILE_TOKEN_SUFFIX)) return 0;
        if (token.name === CONST.COOKIE.GLOBAL_TOKEN) return 2;
        return 1;
    };
    return [...tokens].sort((a, b) => rank(a) - rank(b));
}

/**
 * Fetch the talent profile, trying each OAuth token until one has the required scopes.
 * @returns {Promise<object|undefined>} Returns the talent profile, or undefined if no token worked.
 */
async function fetchTalentProfile(freelancerID) {
    // HttpOnly token cookies are only readable from the background worker
    const auth = await chrome.runtime.sendMessage({ type: CONST.MESSAGE_TYPE.GET_AUTH });
    const tokens = sortTokens(auth?.tokens ?? []);
    for (const token of tokens) {
        const response = await fetch(CONST.API.GRAPHQL_URL, getRequestOptions(freelancerID, token.value, auth.tenantID));
        if (!response.ok) {
            continue;
        }
        const data = await response.json();
        // GraphQL reports query errors with a 200 status, so check the errors array too.
        if (data?.errors?.length) {
            continue;
        }
        return data?.data?.talentVPDAuthProfile;
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
    fetchTalentProfile(freelancerID)
        .then(talentProfile => {
            // No token could fetch the profile, or the freelancer hides their earnings
            if (!talentProfile || talentProfile.hideEarnings) {
                return;
            }
            CACHED_EARNINGS = talentProfile.stats?.totalEarnings;
            if (!CACHED_EARNINGS || typeof CACHED_EARNINGS !== CONST.TYPE.NUMBER) {
                return;
            }

            let attempts = 0;
            const intervalID = setInterval(() => {
                attempts++;
                const isUpdated = styleAndUpdateEarnings(CACHED_EARNINGS);
                if (isUpdated || attempts >= CONST.VALUE.MAX_ATTEMPTS) {
                    clearInterval(intervalID);
                }
            }, CONST.VALUE.POLL_INTERVAL);
        })
        .catch(error => console.warn('Error fetching and displaying earnings:', error));
}

// Event listener to handle window resize
window.addEventListener('resize', () => {
    // check if CACHED_EARNINGS
    if (!CACHED_EARNINGS) {
        return;
    }
    styleAndUpdateEarnings(CACHED_EARNINGS, CONST.VALUE.SHOULD_UPDATE_EARNINGS);
});

// Call the function to fetch and display earnings
fetchAndDisplayEarnings();
