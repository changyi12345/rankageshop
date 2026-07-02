import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envText = readFileSync(join(root, '.env'), 'utf8');
const passMatch = envText.match(/postgres\.ckhfqsfkvnioalrhyiql:([^@]+)@/);
if (!passMatch) {
  console.error('Could not parse password from .env');
  process.exit(1);
}
const pass = passMatch[1];
const ref = 'ckhfqsfkvnioalrhyiql';

const prefixes = ['aws-0', 'aws-1'];
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ap-south-2',
  'ca-central-1', 'sa-east-1',
];

for (const prefix of prefixes) {
  for (const region of regions) {
    const host = `${prefix}-${region}.pooler.supabase.com`;
    const direct = `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres?sslmode=require`;
    process.stdout.write(`Trying ${host} ... `);
    try {
      execSync('npx prisma migrate status', {
        cwd: root,
        env: { ...process.env, DATABASE_URL: direct, DIRECT_URL: direct },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 15000,
      });
      console.log('OK (connected)');
      console.log('\nUse in .env:');
      console.log(`DIRECT_URL="${direct}"`);
      console.log(
        `DATABASE_URL="postgresql://postgres.${ref}:${pass}@${host}:6543/postgres?pgbouncer=true&sslmode=require"`,
      );
      process.exit(0);
    } catch (e) {
      const out = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message ?? ''}`;
      if (/tenant\/user .* not found|ENOTFOUND.*tenant/i.test(out)) {
        console.log('wrong region');
      } else if (/Authentication failed|password authentication/i.test(out)) {
        console.log('REGION MATCH — fix password encoding');
        console.log(`Host: ${host}`);
        process.exit(0);
      } else if (/P1001|Can't reach|ECONNREFUSED|ETIMEDOUT/i.test(out)) {
        console.log('unreachable');
      } else if (/No migration found|following migration|Database schema is up to date/i.test(out)) {
        console.log('OK (connected)');
        console.log(`\nRegion host: ${host}`);
        process.exit(0);
      } else {
        console.log(out.trim().split('\n').slice(-2).join(' | '));
      }
    }
  }
}
console.error('\nNo matching region found — copy Session pooler URI from Supabase Dashboard → Connect');
