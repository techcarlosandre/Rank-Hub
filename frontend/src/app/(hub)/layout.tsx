import HubSidebar from '@/components/HubSidebar';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 aurora-bg opacity-30"></div>
      <div className="noise-overlay"></div>
      
      <div className="relative z-10 flex w-full">
        <HubSidebar />
        <main className="flex-1 lg:pl-64 w-full">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-12 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
