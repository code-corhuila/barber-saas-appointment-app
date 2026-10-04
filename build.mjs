// Builds the remote with Native Federation (the same @softarc version the shell uses) and esbuild.
// Output: dist/appointment/remoteEntry.json and the exposed ./mount module.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { esBuildAdapter } from '@softarc/native-federation-esbuild';
import { federationBuilder } from '@softarc/native-federation/build.js';

// The esbuild adapter writes into the output folder but does not create it.
fs.rmSync('dist/appointment', { recursive: true, force: true });
fs.mkdirSync('dist/appointment', { recursive: true });

await federationBuilder.init({
  options: {
    workspaceRoot: path.resolve('.'),
    outputPath: 'dist/appointment',
    tsConfig: 'tsconfig.json',
    federationConfig: 'federation.config.cjs',
    verbose: false,
  },
  adapter: esBuildAdapter,
});

await federationBuilder.build();
console.log('built dist/appointment');
