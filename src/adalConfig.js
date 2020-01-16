import { AuthenticationContext, adalFetch } from 'react-adal';
import config from './Config';

export const adalConfig = {
    tenant: config.tenantId,
    clientId: config.appId,
    redirectUri: window.location.origin,
    endpoints: {
        api: 'https://graph.microsoft.com',
    },
    cacheLocation: 'localStorage',
};

export const authContext = new AuthenticationContext(adalConfig);

export const adalApiFetch = (fetch, url, options) =>
    adalFetch(authContext, adalConfig.endpoints.api, fetch, url, options);
