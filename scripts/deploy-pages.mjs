import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'build']);

const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).stdout.trim();
const dir = mkdtempSync(join(tmpdir(), 'memo-pages-'));
cpSync('dist', dir, { recursive: true });
writeFileSync(join(dir, '.nojekyll'), '');

run('git', ['init'], dir);
run('git', ['checkout', '-B', 'gh-pages'], dir);
run('git', ['add', '-A'], dir);
run('git', ['-c', 'user.name=memo-app deploy', '-c', 'user.email=deploy@local', 'commit', '-m', 'Deploy GitHub Pages'], dir);
run('git', ['push', '-f', remote, 'HEAD:gh-pages'], dir);
