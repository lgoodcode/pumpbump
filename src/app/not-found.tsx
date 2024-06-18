import Link from 'next/link';
import Image from 'next/image';

// import { Header } from '@/components/public/header';
// import { Footer } from '@/components/public/footer';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <>
      {/* <Header /> */}

      <div className="container h-full flex-grow grid grid-cols-2 mt-12 lg:mt-0 py-32 gap-12 lg:gap-8 ">
        <div className="md:container col-span-2 lg:col-span-1 my-auto space-y-6">
          <h1 className="text-4xl font-semibold leading-snug">
            Oops, the page you&apos;re looking for wasn&apos;t found.
          </h1>
          <div className="mr-auto">
            <Button>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 flex items-center justify-center">
          <Image
            src="/assets/img/404.png"
            alt="404 illustration - Image by pikisuperstar on Freepik"
            className="max-w-lg lg:max-w-none"
            priority
            width={668}
            height={668}
          />
        </div>
      </div>

      {/* <Footer /> */}
    </>
  );
}
