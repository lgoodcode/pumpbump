import Header from '@/components/header';

export default function Home() {
  return (
    <main>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="container mx-auto mt-24">
          <div className="mx-auto mt-12 flex flex-1 flex-col items-center justify-center space-y-10">
            <h1 className="text-7xl text-center font-normal tracking-tighter animate-blur-in">
              <div className="block">
                <span className="bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Get ahead of the curve with
                </span>
              </div>
              <span className="bg-gradient-to-r from-[#5894c9] from-10% to-[#bd1bc0] bg-clip-text text-transparent">
                the best bump bot.
              </span>
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
}
