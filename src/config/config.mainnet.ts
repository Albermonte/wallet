import { ENV_MAIN } from '../lib/Constants';

export default {
    hubEndpoint: 'https://hub.nimiq.com',
    environment: ENV_MAIN,
    networkEndpoint: 'https://network.nimiq.com',
    reportToSentry: true,
    enableBitcoin: true,

    fastspot: {
        apiEndpoint: 'https://api.go.fastspot.io/fast/v1',
        apiKey: 'c20d43d0-8f60-4fca-a298-85e80f64d042',
        watchtowerEndpoint: 'https://watch.fastspot.io/main',
    },

    oasis: {
        apiEndpoint: 'https://oasis.ten31.com/v1',
        feePercentage: 0, // 0% - Set to 0.01 for 1%
    },
};
