import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../core/container/container';
import { Injectable, Cache } from '../decorators';
import { OnInit, OnDestroy } from '../lifecycle/lifecycle';


@Injectable()
class SimpleService {
    getValue() {
        return 42;
    }
}

@Injectable()
class Logger {
    log(msg: string) {
        return `[LOG] ${msg}`;
    }
}

@Injectable()
class UserService {
    constructor(private logger: Logger) { }

    createUser(name: string) {
        return this.logger.log(`Created user: ${name}`);
    }
}

@Injectable()
class Database {
    query() {
        return 'data';
    }
}

@Injectable()
class Repository {
    constructor(private db: Database) { }

    find() {
        return this.db.query();
    }
}

@Injectable()
class AppService {
    constructor(private repo: Repository) { }

    getData() {
        return this.repo.find();
    }
}

@Injectable()
class SingletonService {
    id = Math.random();
}

@Injectable()
class SharedService {
    callCount = 0;
    call() {
        return ++this.callCount;
    }
}

@Injectable()
class ConsumerA {
    constructor(private shared: SharedService) { }
    use() {
        return this.shared.call();
    }
}

@Injectable()
class ConsumerB {
    constructor(private shared: SharedService) { }
    use() {
        return this.shared.call();
    }
}

let initCallCount = 0;
let destroyCallCountA = 0;
let destroyCallCountB = 0;

@Injectable()
class ServiceWithInit implements OnInit {
    onModuleInit() {
        initCallCount++;
    }
}

@Injectable()
class ServiceWithDestroyA implements OnDestroy {
    onModuleDestroy() {
        destroyCallCountA++;
    }
}

@Injectable()
class ServiceWithDestroyB implements OnDestroy {
    onModuleDestroy() {
        destroyCallCountB++;
    }
}

@Injectable()
class RealDatabase {
    query() {
        return 'real data';
    }
}

@Injectable()
class MockDatabase {
    query() {
        return 'mock data';
    }
}

@Injectable()
class RepositoryWithReal {
    constructor(private db: RealDatabase) { }

    find() {
        return this.db.query();
    }
}

let cacheCallCount = 0;

@Injectable()
class CachedService {
    @Cache({ ttl: 60 })
    expensiveOperation() {
        cacheCallCount++;
        return 'result';
    }
}
@Injectable()
class ThrowingService {
    constructor() {
        throw new Error('Construction failed!');
    }
}


function resetContainer() {
    // @ts-ignore 
    Container._containerInstance = undefined;
}



describe('Container', () => {
    beforeEach(() => {
        resetContainer();
        initCallCount = 0;
        destroyCallCountA = 0;
        destroyCallCountB = 0;
        cacheCallCount = 0;
    });

    describe('singleton pattern', () => {
        it('should return the same Container instance', () => {
            const c1 = Container.instance;
            const c2 = Container.instance;
            expect(c1).toBe(c2);
        });
    });

    describe('resolve - basic DI', () => {
        it('should resolve a class with no dependencies', () => {
            const container = Container.instance;
            const instance = container.resolve(SimpleService);

            expect(instance).toBeDefined();
            expect(instance.getValue()).toBe(42);
        });

        it('should resolve a class with dependencies', () => {
            const container = Container.instance;
            const userService = container.resolve(UserService);

            expect(userService).toBeDefined();
            expect(userService.createUser('Alice')).toBe('[LOG] Created user: Alice');
        });

        it('should resolve nested dependencies', () => {
            const container = Container.instance;
            const service = container.resolve(AppService);

            expect(service.getData()).toBe('data');
        });
    });

    describe('singleton scope', () => {
        it('should return the same instance on multiple resolves', () => {
            const container = Container.instance;
            const instance1 = container.resolve(SingletonService);
            const instance2 = container.resolve(SingletonService);

            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(instance2.id);
        });

        it('should share dependencies across consumers', () => {
            const container = Container.instance;
            const a = container.resolve(ConsumerA);
            const b = container.resolve(ConsumerB);

            expect(a.use()).toBe(1);
            expect(b.use()).toBe(2);
            expect(a.use()).toBe(3);
        });
    });

    describe('lifecycle hooks', () => {
        it('should call onModuleInit on resolve', () => {
            const container = Container.instance;
            container.resolve(ServiceWithInit);

            expect(initCallCount).toBe(1);
        });

        it('should call onModuleInit only once for singleton', () => {
            const container = Container.instance;
            container.resolve(ServiceWithInit);
            container.resolve(ServiceWithInit);
            container.resolve(ServiceWithInit);

            expect(initCallCount).toBe(1);
        });

        it('should call onModuleDestroy on shutdown', async () => {
            const container = Container.instance;
            container.resolve(ServiceWithDestroyA);

            await container.shutdown();

            expect(destroyCallCountA).toBe(1);
        });

        it('should call onModuleDestroy for all instances on shutdown', async () => {
            const container = Container.instance;
            container.resolve(ServiceWithDestroyA);
            container.resolve(ServiceWithDestroyB);

            await container.shutdown();

            expect(destroyCallCountA).toBe(1);
            expect(destroyCallCountB).toBe(1);
        });
    });

    describe('registerOverride', () => {
        it('should allow manual dependency override', () => {
            const container = Container.instance;
            container.registerOverride(RepositoryWithReal, [MockDatabase]);

            const repo = container.resolve(RepositoryWithReal);
            expect(repo.find()).toBe('mock data');
        });
    });

    describe('AOP wrapping', () => {
        it('should return a working instance', () => {
            const container = Container.instance;
            const instance = container.resolve(SimpleService);

            expect(instance.getValue()).toBe(42);
        });

        it('should wrap methods with @Cache decorator', async () => {
            const container = Container.instance;
            const service = container.resolve(CachedService);

            // 第一次调用
            const result1 = await service.expensiveOperation();
            // 第二次调用（应该命中缓存）
            const result2 = await service.expensiveOperation();

            expect(result1).toBe('result');
            expect(result2).toBe('result');
            expect(cacheCallCount).toBe(1); // 只执行了一次
        });
    });

    describe('getInstances', () => {
        it('should return all resolved instances', () => {
            const container = Container.instance;
            container.resolve(SimpleService);
            container.resolve(Logger);

            const instances = container.getInstances();
            expect(instances.size).toBe(2);
        });
    });

    describe('error handling', () => {
        it('should throw meaningful error on resolution failure', () => {
            const container = Container.instance;

            expect(() => container.resolve(ThrowingService)).toThrow(
                /Error resolving ThrowingService/
            );
        });
    });
});