import 'dotenv/config';
import ngrok from '@ngrok/ngrok';

async function main() {
  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  const listener = await ngrok.forward({
    addr: port,
    ...(process.env.NGROK_AUTHTOKEN
      ? { authtoken: process.env.NGROK_AUTHTOKEN }
      : { authtoken_from_env: true }),
  });
  const url = listener.url();

  if (!url) {
    throw new Error('ngrok did not return a public URL');
  }

  console.log('Gebar webhook tunnel is listening.');
  console.log(`Local app: http://localhost:${port}`);
  console.log(`Webhook URL: ${url}/api/gebar/webhook`);
  console.log('Keep this process running while testing local webhooks.');

  process.once('SIGINT', async () => {
    await listener.close();
    process.exit(0);
  });

  process.stdin.resume();
}

main().catch((error) => {
  console.error('Could not start webhook tunnel:', error);
  process.exit(1);
});
