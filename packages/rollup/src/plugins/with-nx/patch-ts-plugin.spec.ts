import { patchTsPluginForWorkspaceLibs } from './with-nx';

describe('patchTsPluginForWorkspaceLibs', () => {
  describe('generateBundle: escaping declarations', () => {
    it('should drop declaration assets with paths starting with ".."', () => {
      const emitted: Array<Record<string, unknown>> = [];
      const mockPlugin = {
        generateBundle: function () {
          (this as any).emitFile({
            type: 'asset',
            fileName: 'src/index.d.ts',
            source: 'export declare const x: number;',
          });
          (this as any).emitFile({
            type: 'asset',
            fileName: '../../util-lib/src/index.d.ts',
            source: 'export declare function greet(): string;',
          });
          (this as any).emitFile({
            type: 'asset',
            fileName: '../other/types.d.ts',
            source: 'export type Foo = string;',
          });
        },
      };

      const patched = patchTsPluginForWorkspaceLibs(mockPlugin);
      const ctx = {
        emitFile: (emission: Record<string, unknown>) => {
          emitted.push(emission);
        },
      };

      patched.generateBundle.call(ctx);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].fileName).toBe('src/index.d.ts');
    });

    it('should pass through non-asset emissions unchanged', () => {
      const emitted: Array<Record<string, unknown>> = [];
      const mockPlugin = {
        generateBundle: function () {
          (this as any).emitFile({
            type: 'chunk',
            fileName: '../some-chunk.js',
          });
        },
      };

      const patched = patchTsPluginForWorkspaceLibs(mockPlugin);
      const ctx = {
        emitFile: (emission: Record<string, unknown>) => {
          emitted.push(emission);
        },
      };

      patched.generateBundle.call(ctx);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].fileName).toBe('../some-chunk.js');
    });
  });

  describe('buildStart: TS6059 suppression', () => {
    it('should downgrade TS6059 errors to warnings', () => {
      const warnings: string[] = [];
      const errors: string[] = [];
      const mockPlugin = {
        buildStart: function () {
          // Simulate @rollup/plugin-typescript emitting TS6059
          (this as any).error({
            message:
              "@rollup/plugin-typescript TS6059: File '/libs/util/src/index.ts' is not under 'rootDir'",
          });
        },
      };

      const patched = patchTsPluginForWorkspaceLibs(mockPlugin);
      const ctx = {
        error: (e: any) => {
          errors.push(e.message ?? e);
          throw new Error(e.message ?? e);
        },
        warn: (e: any) => {
          warnings.push(e.message ?? e);
        },
      };

      // Should NOT throw — TS6059 is downgraded to warning
      patched.buildStart.call(ctx);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('TS6059');
    });

    it('should let non-TS6059 errors through', () => {
      const mockPlugin = {
        buildStart: function () {
          (this as any).error({ message: 'Some other TS error' });
        },
      };

      const patched = patchTsPluginForWorkspaceLibs(mockPlugin);
      const ctx = {
        error: (e: any) => {
          throw new Error(e.message ?? e);
        },
        warn: () => {},
      };

      expect(() => patched.buildStart.call(ctx)).toThrow('Some other TS error');
    });
  });

  it('should return plugin as-is if hooks are missing', () => {
    const plugin = { name: 'test' };
    const result = patchTsPluginForWorkspaceLibs(plugin as any);
    expect(result).toBe(plugin);
  });
});
