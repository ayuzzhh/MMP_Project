import { fork } from 'child_process';
import path from 'path';

process.env.NODE_ENV = 'test';

console.log('🚀 Running Full LandGuard Test Suite (API + Auth RBAC + GIS Cadastre + Records)...\n');

function runScript(scriptPath: string): Promise<number> {
  return new Promise((resolve) => {
    const child = fork(scriptPath, [], {
      execArgv: ['-r', 'ts-node/register'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    child.on('exit', (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  // Suite 1: Core API
  const apiCode = await runScript(path.join(__dirname, 'api.test.ts'));
  if (apiCode !== 0) process.exit(apiCode);

  // Suite 2: Auth & RBAC
  const authCode = await runScript(path.join(__dirname, 'auth.test.ts'));
  if (authCode !== 0) process.exit(authCode);

  // Suite 3: GIS & Cadastral Operations
  const gisCode = await runScript(path.join(__dirname, 'gis.test.ts'));
  if (gisCode !== 0) process.exit(gisCode);

  // Suite 4: Domain Intelligence & Two-Man Rule Records
  const recordsCode = await runScript(path.join(__dirname, 'records.test.ts'));
  if (recordsCode !== 0) process.exit(recordsCode);

  // Suite 5: Document Storage, OCR & Human Verification
  const docsCode = await runScript(path.join(__dirname, 'documents.test.ts'));
  if (docsCode !== 0) process.exit(docsCode);

  // Suite 6: Token Monetization, Wallet & Razorpay Verification
  const walletCode = await runScript(path.join(__dirname, 'wallet.test.ts'));
  if (walletCode !== 0) process.exit(walletCode);

  // Suite 7: Smart Land Identification & Admin Reauth
  const smartLandCode = await runScript(path.join(__dirname, 'smartLandIdentification.test.ts'));
  if (smartLandCode !== 0) process.exit(smartLandCode);

  // Suite 8: Dedicated Satellite Imagery & Spatial Sensor API
  const satCode = await runScript(path.join(__dirname, 'satelliteApi.test.ts'));
  if (satCode !== 0) process.exit(satCode);

  console.log('\n🌟 ALL 8 TEST SUITES (API, AUTH RBAC, GIS CADASTRE, RECORDS, OCR, WALLET, SMART LAND ID & SATELLITE API) COMPLETED WITH 100% PASS RATE!');
  process.exit(0);
}

main();
