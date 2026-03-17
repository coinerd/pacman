/**
 * ServiceContainer
 * Dependency Injection Container for managing service lifecycles
 */

export class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.instances = new Map();
    }

    /**
     * Register a service factory
     * @param {string} name - Service name
     * @param {Function} factory - Factory function that creates the service
     * @param {boolean} singleton - Whether this service is a singleton
     */
    register(name, factory, singleton = true) {
        this.services.set(name, factory);
        if (singleton) {
            this.singletons.set(name, true);
        }
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} - Service instance
     */
    get(name) {
        // If it's a singleton and already instantiated, return the cached instance
        if (this.singletons.has(name) && this.instances.has(name)) {
            return this.instances.get(name);
        }

        // Create new instance using the factory
        const factory = this.services.get(name);
        if (!factory) {
            throw new Error(`Service '${name}' is not registered`);
        }

        const instance = factory(this);

        // If it's a singleton, cache the instance
        if (this.singletons.has(name)) {
            this.instances.set(name, instance);
        }

        return instance;
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Unregister a service (useful for testing)
     * @param {string} name - Service name
     */
    unregister(name) {
        this.services.delete(name);
        this.singletons.delete(name);
        const instance = this.instances.get(name);

        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }

        this.instances.delete(name);
    }

    /**
     * Clear all services (useful for testing)
     */
    clear() {
        // Destroy all instances that have a destroy method
        for (const [, instance] of this.instances) {
            if (typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }

        this.services.clear();
        this.singletons.clear();
        this.instances.clear();
    }

    /**
     * Get all registered service names
     * @returns {Array<string>}
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Get all singleton names
     * @returns {Array<string>}
     */
    getSingletonNames() {
        return Array.from(this.singletons.keys());
    }

    /**
     * Get all instantiated service names
     * @returns {Array<string>}
     */
    getInstanceNames() {
        return Array.from(this.instances.keys());
    }
}

// Default global container instance
export const globalContainer = new ServiceContainer();
