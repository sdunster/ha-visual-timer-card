import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/ha-visual-timer-card.ts',
  onwarn(warning, warn) {
    // @formatjs/intl-utils uses CommonJS `this` patterns; safe to ignore.
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
  output: {
    file: 'dist/ha-visual-timer-card.js',
    format: 'es',
    sourcemap: false,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser({
      format: { comments: false },
      compress: { passes: 2 },
    }),
  ],
};
