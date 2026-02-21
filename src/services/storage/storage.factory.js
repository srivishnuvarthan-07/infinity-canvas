import localProvider from './local.provider';
import cloudProvider from './cloud.provider';

class StorageFactory {
    constructor() {
        this.providers = {
            local: localProvider,
            cloud: cloudProvider
        };
    }

    getProvider(mode) {
        const provider = this.providers[mode];
        if (!provider) {
            console.warn(`StorageFactory: Unknown mode '${mode}', defaulting to local`);
            return this.providers.local;
        }
        return provider;
    }
}

export default new StorageFactory();
