module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended-legacy',
    'plugin:jest/recommended',
    'prettier'
  ],
  plugins: [
    'node',
    'security',
    'jest'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  settings: {
    node: {
      allowModules: [
        '@modelcontextprotocol/sdk'
      ],
      tryExtensions: ['.js', '.json', '.node']
    }
  },
  rules: {
    // Error Prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code Quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 2 }],
    'eol-last': 'error',
    'comma-dangle': ['error', 'never'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    
    // Async/Await - More lenient for wrapper functions
    'require-await': 'warn', // Changed from error to warn
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Security - Balanced for internal tools
    'security/detect-object-injection': 'warn', // Changed from error to warn for internal tools
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Node.js specific
    'node/no-unpublished-require': 'off',
    'node/no-missing-require': 'error',
    'node/no-extraneous-require': 'error',
    'node/prefer-global/buffer': 'error',
    'node/prefer-global/process': 'error',
    'node/prefer-promises/fs': 'error',
    
    // Jest specific
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'jest/no-standalone-expect': 'warn' // Allow expect in beforeEach/afterEach
  },
  overrides: [
    {
      files: ['src/index.js', 'index.js', 'examples/**/*.js', 'src/**/__tests__/**/*.js'],
      rules: {
        'node/no-missing-require': 'off' // Disable for MCP SDK subpath imports that work at runtime
      }
    },
    {
      files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'node/no-unpublished-require': 'off',
        'security/detect-non-literal-require': 'off',
        'security/detect-object-injection': 'off', // Allow in tests
        'require-await': 'off', // Allow async test functions without await
        'jest/no-standalone-expect': 'off', // Allow expect in beforeEach
        'jest/expect-expect': 'off' // Allow tests without explicit expects (for setup tests)
      }
    },
    {
      files: ['src/config/**/*.js'],
      rules: {
        'security/detect-non-literal-require': 'off',
        'security/detect-object-injection': 'off' // Allow for config objects
      }
    },
    {
      files: ['src/api/**/*.js'],
      rules: {
        'require-await': 'off' // API wrapper functions may not need await
      }
    },
    {
      files: ['src/tools/**/*.js'],
      rules: {
        'security/detect-object-injection': 'warn', // Tools may need dynamic property access
        'require-await': 'off' // Tool handlers may not need await
      }
    },
    {
      files: ['src/security/**/*.js'],
      rules: {
        'security/detect-object-injection': 'off' // Security module needs dynamic access for validation
      }
    }
  ],
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    module: 'readonly',
    require: 'readonly',
    exports: 'readonly',
    console: 'readonly'
  }
}; 