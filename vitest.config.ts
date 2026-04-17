import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
    oxc: false,
    plugins: [
        swc.vite({
            jsc: {
                parser: {
                    syntax: 'typescript',
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});