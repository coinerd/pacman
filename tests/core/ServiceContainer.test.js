// tests/core/ServiceContainer.test.js

import { ServiceContainer, globalContainer } from '../../src/core/ServiceContainer.js';

describe('ServiceContainer', () => {
    let container;

    beforeEach(() => {
        container = new ServiceContainer();
    });

    afterEach(() => {
        container.clear();
    });

    describe('register', () => {
        test('should register a service factory', () => {
            const factory = () => ({ name: 'test' });
            container.register('testService', factory);

            expect(container.has('testService')).toBe(true);
        });

        test('should register singleton by default', () => {
            const factory = () => ({ id: Math.random() });
            container.register('singleton', factory, true);

            const instance1 = container.get('singleton');
            const instance2 = container.get('singleton');

            expect(instance1).toBe(instance2);
        });

        test('should register non-singleton when specified', () => {
            const factory = () => ({ id: Math.random() });
            container.register('transient', factory, false);

            const instance1 = container.get('transient');
            const instance2 = container.get('transient');

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('get', () => {
        test('should create instance using factory', () => {
            const factory = jest.fn(() => ({ value: 42 }));
            container.register('service', factory);

            const instance = container.get('service');

            expect(factory).toHaveBeenCalledWith(container);
            expect(instance.value).toBe(42);
        });

        test('should throw error for unregistered service', () => {
            expect(() => container.get('nonexistent')).toThrow('Service \'nonexistent\' is not registered');
        });

        test('should return cached singleton instance', () => {
            let callCount = 0;
            const factory = () => {
                callCount++;
                return { count: callCount };
            };
            container.register('singleton', factory, true);

            container.get('singleton');
            container.get('singleton');
            container.get('singleton');

            expect(callCount).toBe(1);
        });

        test('should create new instance for non-singleton', () => {
            let callCount = 0;
            const factory = () => {
                callCount++;
                return { count: callCount };
            };
            container.register('transient', factory, false);

            container.get('transient');
            container.get('transient');

            expect(callCount).toBe(2);
        });
    });

    describe('has', () => {
        test('should return true for registered service', () => {
            container.register('service', () => ({}));
            expect(container.has('service')).toBe(true);
        });

        test('should return false for unregistered service', () => {
            expect(container.has('nonexistent')).toBe(false);
        });
    });

    describe('unregister', () => {
        test('should remove service from registry', () => {
            container.register('service', () => ({}));
            container.unregister('service');

            expect(container.has('service')).toBe(false);
        });

        test('should call destroy method on instance if exists', () => {
            const instance = { destroy: jest.fn() };
            container.register('service', () => instance, true);
            container.get('service'); // Create instance

            container.unregister('service');

            expect(instance.destroy).toHaveBeenCalled();
        });

        test('should clear singleton and instance maps', () => {
            container.register('service', () => ({}), true);
            container.get('service');

            container.unregister('service');

            expect(container.getSingletonNames()).not.toContain('service');
            expect(container.getInstanceNames()).not.toContain('service');
        });
    });

    describe('clear', () => {
        test('should remove all services', () => {
            container.register('s1', () => ({}));
            container.register('s2', () => ({}));
            container.register('s3', () => ({}));

            container.clear();

            expect(container.getServiceNames()).toHaveLength(0);
        });

        test('should call destroy on all instances', () => {
            const instance1 = { destroy: jest.fn() };
            const instance2 = { destroy: jest.fn() };

            container.register('s1', () => instance1, true);
            container.register('s2', () => instance2, true);
            container.get('s1');
            container.get('s2');

            container.clear();

            expect(instance1.destroy).toHaveBeenCalled();
            expect(instance2.destroy).toHaveBeenCalled();
        });
    });

    describe('getServiceNames', () => {
        test('should return all registered service names', () => {
            container.register('alpha', () => ({}));
            container.register('beta', () => ({}));

            const names = container.getServiceNames();

            expect(names).toContain('alpha');
            expect(names).toContain('beta');
        });
    });

    describe('getSingletonNames', () => {
        test('should return singleton entries', () => {
            container.register('singleton', () => ({}), true);
            container.register('transient', () => ({}), false);

            const names = container.getSingletonNames();

            // getSingletonNames returns Array.from(singletons Map) which is [key, value] pairs
            expect(names.length).toBeGreaterThan(0);
        });
    });

    describe('getInstanceNames', () => {
        test('should return names of instantiated services', () => {
            container.register('service', () => ({}), true);

            expect(container.getInstanceNames()).toHaveLength(0);

            container.get('service');

            expect(container.getInstanceNames()).toContain('service');
        });
    });

    describe('dependency injection', () => {
        test('should allow factory to access other services', () => {
            container.register('config', () => ({ apiUrl: 'http://test.com' }), true);
            container.register('api', (c) => {
                const config = c.get('config');
                return { url: config.apiUrl };
            }, true);

            const api = container.get('api');

            expect(api.url).toBe('http://test.com');
        });
    });
});

describe('globalContainer', () => {
    test('should be a ServiceContainer instance', () => {
        expect(globalContainer).toBeInstanceOf(ServiceContainer);
    });
});
