import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injectable, Body, Query, Param, Header } from '../decorators';
import { resolveHandlerArguments } from '../validation/resolveHandlerArgument';
import { rule } from '../validation/rule';
import { Container } from '../core/container/container';

// ============================================
// Helpers
// ============================================

function resetContainer() {
    // @ts-ignore
    Container._containerInstance = undefined;
}

// ============================================
// Tests
// ============================================

describe('RuleBuilder', () => {
    describe('required', () => {
        it('should create required rule', () => {
            const rules = rule().required().build();

            expect(rules).toContainEqual({ type: 'required' });
        });
    });

    describe('min', () => {
        it('should create min rule', () => {
            const rules = rule().min(5).build();

            expect(rules).toContainEqual({ type: 'min', value: 5 });
        });
    });

    describe('max', () => {
        it('should create max rule', () => {
            const rules = rule().max(100).build();

            expect(rules).toContainEqual({ type: 'max', value: 100 });
        });
    });

    describe('minLength', () => {
        it('should create minLength rule', () => {
            const rules = rule().minLength(3).build();

            expect(rules).toContainEqual({ type: 'minLength', value: 3 });
        });
    });

    describe('maxLength', () => {
        it('should create maxLength rule', () => {
            const rules = rule().maxLength(50).build();

            expect(rules).toContainEqual({ type: 'maxLength', value: 50 });
        });
    });

    describe('pattern', () => {
        it('should create pattern rule', () => {
            const emailRegex = /^[\w-]+@[\w-]+\.\w+$/;
            const rules = rule().pattern(emailRegex).build();

            expect(rules).toContainEqual({ type: 'pattern', value: emailRegex });
        });
    });

    describe('custom', () => {
        it('should create custom rule', () => {
            const validator = (v: any) => v > 0;
            const rules = rule().custom(validator).build();

            expect(rules).toContainEqual({ type: 'custom', value: validator });
        });
    });

    describe('chaining', () => {
        it('should chain multiple rules', () => {
            const rules = rule()
                .required()
                .minLength(3)
                .maxLength(20)
                .pattern(/^[a-z]+$/)
                .build();

            expect(rules).toHaveLength(4);
        });

        it('should maintain order', () => {
            const rules = rule()
                .required()
                .min(1)
                .max(10)
                .build();

            expect(rules[0].type).toBe('required');
            expect(rules[1].type).toBe('min');
            expect(rules[2].type).toBe('max');
        });
    });
});

describe('resolveHandlerArguments', () => {
    beforeEach(() => {
        resetContainer();
    });

    describe('param extraction', () => {
        it('should extract body', () => {
            @Injectable()
            class TestController {
                handler(@Body() body: any) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { body: { name: 'Alice' } }
            );

            expect(args[0]).toEqual({ name: 'Alice' });
        });

        it('should extract specific body field', () => {
            @Injectable()
            class TestController {
                handler(@Body('name') name: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { body: { name: 'Alice', age: 30 } }
            );

            expect(args[0]).toBe('Alice');
        });

        it('should extract query param', () => {
            @Injectable()
            class TestController {
                handler(@Query('page') page: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: { page: '1', limit: '10' } }
            );

            expect(args[0]).toBe('1');
        });

        it('should extract route param', () => {
            @Injectable()
            class TestController {
                handler(@Param('id') id: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { params: { id: '123' } }
            );

            expect(args[0]).toBe('123');
        });

        it('should extract header', () => {
            @Injectable()
            class TestController {
                handler(@Header('authorization') auth: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { headers: { authorization: 'Bearer token' } }
            );

            expect(args[0]).toBe('Bearer token');
        });

        it('should handle multiple params', () => {
            @Injectable()
            class TestController {
                handler(
                    @Param('id') id: string,
                    @Query('include') include: string,
                    @Body() body: any
                ) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                {
                    params: { id: '456' },
                    query: { include: 'posts' },
                    body: { data: true },
                }
            );

            expect(args[0]).toBe('456');
            expect(args[1]).toBe('posts');
            expect(args[2]).toEqual({ data: true });
        });
    });

    describe('type casting', () => {
        it('should cast to Number', () => {
            @Injectable()
            class TestController {
                handler(@Query('count') count: number) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: { count: '42' } }
            );

            expect(args[0]).toBe(42);
            expect(typeof args[0]).toBe('number');
        });

        it('should throw on invalid number cast', () => {
            @Injectable()
            class TestController {
                handler(@Query('count') count: number) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { query: { count: 'not-a-number' } }
            )).toThrow(/Cannot cast/);
        });

        it('should cast to Boolean', () => {
            @Injectable()
            class TestController {
                handler(@Query('active') active: boolean) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: { active: 'true' } }
            );

            expect(args[0]).toBe(true);
        });
    });

    describe('validation', () => {
        it('should pass validation', () => {
            @Injectable()
            class TestController {
                handler(
                    @Query({
                        key: 'page',
                        validator: rule().required().min(1),
                    })
                    page: number
                ) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: { page: '5' } }
            );

            expect(args[0]).toBe(5);
        });

        it('should fail validation for missing required', () => {
            @Injectable()
            class TestController {
                handler(
                    @Query({
                        key: 'page',
                        validator: rule().required(),
                    })
                    page: string
                ) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { query: {} }
            )).toThrow(/Validation failed/);
        });

        it('should fail validation for min', () => {
            @Injectable()
            class TestController {
                handler(
                    @Query({
                        key: 'age',
                        validator: rule().min(18),
                    })
                    age: number
                ) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { query: { age: '15' } }
            )).toThrow(/Validation failed/);
        });

        it('should fail validation for max', () => {
            @Injectable()
            class TestController {
                handler(
                    @Query({
                        key: 'count',
                        validator: rule().max(100),
                    })
                    count: number
                ) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { query: { count: '150' } }
            )).toThrow(/Validation failed/);
        });

        it('should fail validation for minLength', () => {
            @Injectable()
            class TestController {
                handler(
                    @Body({
                        key: 'name',
                        validator: rule().minLength(3),
                    })
                    name: string
                ) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { body: { name: 'ab' } }
            )).toThrow(/Validation failed/);
        });

        it('should fail validation for pattern', () => {
            @Injectable()
            class TestController {
                handler(
                    @Body({
                        key: 'email',
                        validator: rule().pattern(/^[\w-]+@[\w-]+\.\w+$/),
                    })
                    email: string
                ) {}
            }

            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { body: { email: 'invalid-email' } }
            )).toThrow(/Validation failed/);
        });

        it('should support custom validator function', () => {
            const isEven = (v: number) => v % 2 === 0;

            @Injectable()
            class TestController {
                handler(
                    @Query({
                        key: 'num',
                        validator: isEven,
                    })
                    num: number
                ) {}
            }

            // Should pass for even number
            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: { num: '4' } }
            );
            expect(args[0]).toBe(4);

            // Should fail for odd number
            expect(() => resolveHandlerArguments(
                TestController,
                'handler',
                { query: { num: '5' } }
            )).toThrow(/Validation failed/);
        });
    });

    describe('edge cases', () => {
        it('should return empty array for method without params', () => {
            @Injectable()
            class TestController {
                handler() {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                {}
            );

            expect(args).toEqual([]);
        });

        it('should handle undefined values', () => {
            @Injectable()
            class TestController {
                handler(@Query('optional') optional: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { query: {} }
            );

            expect(args[0]).toBeUndefined();
        });

        it('should handle header case insensitivity', () => {
            @Injectable()
            class TestController {
                handler(@Header('Content-Type') contentType: string) {}
            }

            const args = resolveHandlerArguments(
                TestController,
                'handler',
                { headers: { 'content-type': 'application/json' } }
            );

            expect(args[0]).toBe('application/json');
        });
    });
});