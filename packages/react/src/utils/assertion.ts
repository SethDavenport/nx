import { logger } from '@nx/devkit';
import { type Schema } from '../generators/application/schema';

const VALID_STYLES = [
  'css',
  'scss',
  'less',
  'styled-components',
  '@emotion/styled',
  'styled-jsx',
  'none',
];

const DEPRECATED_STYLES = [
  'less',
  'styled-components',
  '@emotion/styled',
  'styled-jsx',
];

export function assertValidStyle(style: string): void {
  if (VALID_STYLES.indexOf(style) === -1) {
    throw new Error(
      `Unsupported style option found: ${style}. Valid values are: "${VALID_STYLES.join(
        '", "'
      )}"`
    );
  }
  if (DEPRECATED_STYLES.includes(style)) {
    logger.warn(
      `\nNote: "${style}" style support is deprecated and will be removed in Nx v24.\n` +
        `We recommend using "css" or "scss" instead. You can manually add any styling\n` +
        `solution (e.g. Tailwind CSS, styled-components) after generating the project.\n`
    );
  }
}

export function assertValidReactRouter(
  reactRouter: boolean,
  bundler: Schema['bundler']
): void {
  if (reactRouter && bundler !== 'vite') {
    throw new Error(
      `Unsupported bundler found: ${bundler}. React Router is only supported with 'vite'.`
    );
  }
}
