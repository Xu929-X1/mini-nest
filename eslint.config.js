import tseslint, { plugin } from 'typescript-eslint';

export default [
    {
        ignores: ['dist', 'node_modules', 'build'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': plugin,
        },
        rules: {
            ...tseslint.configs.recommended[0].rules,
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
];