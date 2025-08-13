import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/prefer-readonly': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-undef': 'off',
      // パラメータプロパティ対応：TypeScriptコンストラクタパラメータの誤検知を防ぐ
      '@typescript-eslint/no-unused-vars': ['error', { 
        args: 'after-used',      // パラメータプロパティの誤検知防止（メイン設定）
        caughtErrors: 'none'     // catch文のエラー引数は警告しない
      }],
      // 通常のno-unused-varsを無効化してTypeScript版を使用
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.js',
      'src/overlay/overlay-preact/**',
      'playground/**',
    ],
  },
];