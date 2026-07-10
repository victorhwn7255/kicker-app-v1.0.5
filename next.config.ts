import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Pin the workspace root to this repo. The machine has other lockfiles
  // higher up the tree, which would otherwise mis-scope Next's build traces.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
