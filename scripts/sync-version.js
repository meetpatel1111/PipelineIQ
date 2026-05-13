import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function syncVersions() {
  const pkg = await fs.readJson(path.join(rootDir, 'package.json'));
  const version = pkg.version;
  const author = pkg.author;
  const [major, minor, patch] = version.split('.').map(Number);

  console.log(`Syncing version ${version} and author ${author} to all manifest files...`);

  // 1. Sync action.yml
  const actionPath = path.join(rootDir, 'action.yml');
  if (await fs.pathExists(actionPath)) {
    let actionContent = await fs.readFile(actionPath, 'utf-8');
    
    // Sync Version
    const versionRegex = /^version:.*$/m;
    if (versionRegex.test(actionContent)) {
      actionContent = actionContent.replace(versionRegex, `version: '${version}'`);
    } else {
      actionContent = actionContent.replace(/^description:.*$/m, (match) => `${match}\nversion: '${version}'`);
    }

    // Sync Author
    const authorRegex = /^author:.*$/m;
    if (authorRegex.test(actionContent)) {
      actionContent = actionContent.replace(authorRegex, `author: ${author}`);
    }

    await fs.writeFile(actionPath, actionContent);
    console.log('✓ Updated action.yml');
  }

  // 2. Sync task.json
  const taskPath = path.join(rootDir, 'task.json');
  if (await fs.pathExists(taskPath)) {
    const task = await fs.readJson(taskPath);
    task.version = { Major: major, Minor: minor, Patch: patch };
    task.author = author;
    await fs.writeJson(taskPath, task, { spaces: 2 });
    console.log('✓ Updated task.json');
  }

  console.log('Version synchronization complete.');
}

syncVersions().catch(err => {
  console.error('Error syncing versions:', err);
  process.exit(1);
});
