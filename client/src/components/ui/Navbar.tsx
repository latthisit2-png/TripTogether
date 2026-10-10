'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <span className="text-2xl">✈️</span>
          <span>TripTogether</span>
        </Link>
        <Link
          href="/trips/create"
          className="btn-primary text-sm py-2 px-4"
        >
          + สร้างทริปใหม่
        </Link>
      </div>
    </nav>
  );
}
