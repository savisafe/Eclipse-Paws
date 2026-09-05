import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
    },
  },
  {
    files: ['tests/**/*.ts', '**/*.test.{ts,tsx}', 'vite.config.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  // ARC-001: architectural boundaries from docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md §4.
  // `core` must stay pure — no Phaser/React/DOM/Capacitor, no dependency on other layers.
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'phaser', message: 'core must not depend on Phaser (see plan §4).' },
            { name: 'react', message: 'core must not depend on React (see plan §4).' },
            { name: 'react-dom', message: 'core must not depend on React (see plan §4).' },
          ],
          patterns: [
            {
              group: ['@capacitor/*', '@adapters/*', '@ui/*', '@content/*', '@application/*'],
              message:
                'core must not depend on adapters, ui, content or application (see plan §4).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'core must not touch DOM globals (see plan §4).' },
        { name: 'document', message: 'core must not touch DOM globals (see plan §4).' },
        { name: 'localStorage', message: 'core must not touch DOM globals (see plan §4).' },
      ],
    },
  },
  // `application` coordinates use cases through ports; it must not reach into concrete
  // rendering adapters, UI, or the platform shell.
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'phaser', message: 'application must not depend on Phaser (see plan §4).' },
            { name: 'react', message: 'application must not depend on React (see plan §4).' },
            { name: 'react-dom', message: 'application must not depend on React (see plan §4).' },
          ],
          patterns: [
            {
              group: ['@capacitor/*', '@adapters/*', '@ui/*'],
              message: 'application depends on ports, not concrete adapters or ui (see plan §4).',
            },
          ],
        },
      ],
    },
  },
  // `content` holds declarative, checkable configuration — not scene/runtime logic.
  {
    files: ['src/content/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'phaser', message: 'content must stay declarative (see plan §4).' }],
          patterns: [
            {
              group: ['@capacitor/*', '@adapters/*', '@ui/*', '@application/*'],
              message: 'content must stay declarative data, not runtime logic (see plan §4).',
            },
          ],
        },
      ],
    },
  },
  // `adapters/phaser` translates Phaser events into application commands; it must not reach
  // into React UI directly (see plan §4).
  {
    files: ['src/adapters/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ui/*'],
              message: 'adapters must not depend on ui (see plan §4).',
            },
          ],
        },
      ],
    },
  },
  // localStorage access is only allowed inside the SaveRepository implementation (see plan §4).
  // src/ui/composition-root.ts is the composition root: it only passes the `Storage` reference
  // into the adapter and never reads/writes through it directly.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/adapters/storage/**', 'src/ui/composition-root.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message: 'localStorage is only allowed inside SaveRepository implementations (plan §4).',
        },
      ],
    },
  },
);
