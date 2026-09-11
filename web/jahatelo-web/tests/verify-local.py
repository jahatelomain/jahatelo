"""macOS-only offline verification. Never invokes dotenv, Expo or next/jest."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

WEB = Path(__file__).resolve().parents[1]
REPO = WEB.parents[1]
APP = REPO / 'app/jahatelo-app'
NODE = shutil.which('node')
if not NODE or not shutil.which('sandbox-exec'):
    sys.exit('Requires installed node and macOS sandbox-exec; no unsafe fallback.')

with tempfile.TemporaryDirectory(prefix='jahatelo-security-') as tmp:
    env = {'PATH': os.pathsep.join([str(Path(NODE).parent), '/usr/bin', '/bin']),
           'HOME': tmp, 'TMPDIR': tmp, 'NODE_ENV': 'test', 'CI': '1',
           'JWT_SECRET': 'offline-fixture-not-a-real-credential'}
    profile = ('(version 1) (allow default) (deny network*) '
               '(deny file-read* (regex #"(^|/)\\.env($|[./])")) '
               f'(deny file-write* (subpath "{REPO}"))')
    command = ['/usr/bin/sandbox-exec', '-p', profile, NODE]
    probe = "require('net').connect(9,'127.0.0.1').on('error',e=>{console.log('Network guard:',e.code);process.exit(e.code==='EPERM'?0:1)})"
    subprocess.run(command + ['-e', probe], env=env, cwd=WEB, check=True)
    mode = sys.argv[1]
    cwd = APP if mode.endswith('-app') else WEB
    if mode == 'test':
        args = ['node_modules/jest/bin/jest.js', '--config', sys.argv[2], '--runInBand', '--no-cache', '--cacheDirectory', tmp] + sys.argv[3:]
    elif mode in ('tsc', 'tsc-app'):
        args = ['node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false']
    elif mode in ('lint', 'lint-app'):
        args = ['node_modules/eslint/bin/eslint.js', '--no-cache'] + sys.argv[2:]
    else:
        sys.exit('Mode: test CONFIG [args] | tsc | tsc-app | lint FILES | lint-app FILES')
    print('CWD:', cwd, '\nCOMMAND:', ' '.join(args), flush=True)
    result = subprocess.run(command + args, env=env, cwd=cwd)
    print('EXIT:', result.returncode, flush=True)
    sys.exit(result.returncode)
