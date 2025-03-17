import CoinMonitor from '@/app/components/CoinMonitor';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">CEX Wallet Monitor</h1>
      <CoinMonitor />
    </div>
  );
}
