import Image from 'next/image';

export default function TopNavSkeleton() {
  return (
    <header
      id="skeleton-app-bar"
      className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50"
      aria-hidden="true"
      role="presentation"
    >
      <div className="mx-auto h-full flex items-center px-4 md:px-8">
        <div className="flex items-center gap-2 justify-center">
          <Image
            src="/logo.webp"
            alt="SatsTheWay"
            width={40}
            height={40}
            priority
            className="w-10 h-10"
          />
          <div className="text-lg text-[#714F09]">SatsTheWay</div>
        </div>
        <nav className="hidden md:flex ml-6 space-x-6 text-gray-600">
          <span>Read</span>
          <span>Write</span>
        </nav>
        <div className="flex-1" />
        <div className="w-24 h-8 bg-gray-200 rounded" />
      </div>
    </header>
  );
}
