import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';

const execAsync = promisify(require('node:child_process').exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function getPostgresURL(): Promise<string> {
  console.log('\n--- Step 1: Database Setup ---');
  const dbChoice = await question(
    'Do you want to use a local Postgres instance with Docker (L) or a remote Postgres instance (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    console.log('Setting up local Postgres instance with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  } else {
    console.log(
      'You can find Postgres databases at: https://vercel.com/marketplace?category=databases'
    );
    return await question('Enter your POSTGRES_URL: ');
  }
}

async function setupLocalPostgres() {
  console.log('Checking if Docker is installed...');
  try {
    await execAsync('docker --version');
    console.log('Docker is installed.');
  } catch (error) {
    console.error(
      'Docker is not installed. Please install Docker and try again.'
    );
    console.log(
      'To install Docker, visit: https://docs.docker.com/get-docker/'
    );
    process.exit(1);
  }

  console.log('Creating docker-compose.yml file...');
  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: next_saas_starter_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(
    path.join(process.cwd(), 'docker-compose.yml'),
    dockerComposeContent
  );
  console.log('docker-compose.yml file created.');

  console.log('Starting Docker container with `docker compose up -d`...');
  try {
    await execAsync('docker compose up -d');
    console.log('Docker container started successfully.');
  } catch (error) {
    console.error(
      'Failed to start Docker container. Please check your Docker installation and try again.'
    );
    process.exit(1);
  }
}

function generateAuthSecret(): string {
  console.log('\n--- Step 2: Generating AUTH_SECRET ---');
  return crypto.randomBytes(32).toString('hex');
}

async function getGebarInfo(): Promise<{
  secretKey: string;
  baseUrl: string;
  webhookSecret: string;
  basePlanId: string;
  plusPlanId: string;
}> {
  console.log('\n--- Step 3: GebarBilling Setup ---');
  console.log(
    'Get your GebarBilling credentials from your dashboard at: https://dashboard.gebarbilling.et'
  );
  
  const secretKey = await question('Enter your GEBARBILLING_SECRET_KEY: ');
  const baseUrl = await question('Enter your GEBARBILLING_BASE_URL (press Enter for default): ');
  const webhookSecret = await question('Enter your GEBARBILLING_WEBHOOK_SECRET: ');
  const basePlanId = await question('Enter your GEBARBILLING_BASE_PLAN_ID: ');
  const plusPlanId = await question('Enter your GEBARBILLING_PLUS_PLAN_ID: ');

  return {
    secretKey: secretKey.trim(),
    baseUrl: baseUrl.trim() || 'https://api.gebarbilling.et',
    webhookSecret: webhookSecret.trim(),
    basePlanId: basePlanId.trim(),
    plusPlanId: plusPlanId.trim(),
  };
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('\n--- Step 4: Writing environment variables to .env ---');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

async function main() {
  console.log('=== SaaS Starter Setup Script ===\n');
  
  const POSTGRES_URL = await getPostgresURL();
  const AUTH_SECRET = generateAuthSecret();
  const BASE_URL = 'http://localhost:3000';
  
  const gebar = await getGebarInfo();

  await writeEnvFile({
    POSTGRES_URL,
    BASE_URL,
    AUTH_SECRET,
    GEBARBILLING_SECRET_KEY: gebar.secretKey,
    GEBARBILLING_BASE_URL: gebar.baseUrl,
    GEBARBILLING_WEBHOOK_SECRET: gebar.webhookSecret,
    GEBARBILLING_BASE_PLAN_ID: gebar.basePlanId,
    GEBARBILLING_PLUS_PLAN_ID: gebar.plusPlanId,
  });

  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. pnpm install');
  console.log('2. pnpm db:generate');
  console.log('3. pnpm db:migrate');
  console.log('4. pnpm db:seed');
  console.log('5. pnpm dev');
}

main().catch(console.error);