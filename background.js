/**
 * Upwork stores the OAuth token that can read talent profiles in an HttpOnly cookie,
 * which content scripts can't access. The background worker reads it via chrome.cookies.
 */
const CONST = {
    DOMAIN: 'upwork.com',
    TOKEN_PREFIX: 'oauth2v2_',
    TENANT_ID_COOKIE: 'current_organization_uid',
    MESSAGE_TYPE: {
        GET_AUTH: 'GET_AUTH'
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CONST.MESSAGE_TYPE.GET_AUTH) {
        return;
    }
    chrome.cookies.getAll({ domain: CONST.DOMAIN }).then(cookies => {
        const tokens = cookies
            .filter(cookie => cookie.value.startsWith(CONST.TOKEN_PREFIX))
            .map(cookie => ({ name: cookie.name, value: cookie.value }));
        const tenantID = cookies.find(cookie => cookie.name === CONST.TENANT_ID_COOKIE)?.value;
        sendResponse({ tokens, tenantID });
    });
    // Keep the message channel open for the async response
    return true;
});
