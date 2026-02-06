// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

describe('Frontend Basic Tests', () => {
  describe('Environment', () => {
    it('should have jsdom environment', () => {
      expect(document).toBeDefined();
      expect(window).toBeDefined();
    });

    it('should have React available', () => {
      const React = require('react');
      expect(React).toBeDefined();
      expect(typeof React.createElement).toBe('function');
    });
  });

  describe('Basic Utilities', () => {
    it('should merge class names with clsx', () => {
      const clsx = require('clsx');
      const classes = clsx('foo', 'bar');
      expect(classes).toBe('foo bar');
    });

    it('should merge tailwind classes', () => {
      const { twMerge } = require('tailwind-merge');
      const classes = twMerge('px-2 py-1', 'px-4');
      expect(classes).toBe('py-1 px-4');
    });
  });

  describe('Component Variants', () => {
    it('should create class variance authority variants', () => {
      const { cva } = require('class-variance-authority');

      const button = cva(['font-semibold', 'border', 'rounded'], {
        variants: {
          intent: {
            primary: ['bg-blue-500', 'text-white'],
            secondary: ['bg-white', 'text-gray-800'],
          },
        },
        defaultVariants: {
          intent: 'primary',
        },
      });

      expect(button({ intent: 'primary' })).toContain('bg-blue-500');
      expect(button({ intent: 'secondary' })).toContain('bg-white');
    });
  });
});
