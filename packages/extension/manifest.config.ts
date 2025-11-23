import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: ['tabs', 'debugger', 'downloads', 'clipboardRead', 'clipboardWrite', 'sidePanel'],
  host_permissions: ['<all_urls>'],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['<all_urls>'],
      run_at: 'document_start',
      match_about_blank: true,
    },
  ],
  background: {
    service_worker: 'src/background/index.ts',
  },
});
