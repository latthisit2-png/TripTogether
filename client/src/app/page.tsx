'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import TripCard from '@/components/trips/TripCard';
import { getTripById } from '@/services/api';
import { getMyTrips, StoredTrip } from '@/utils/storage';
import type { Trip } from '@/services/api';

interface DisplayTrip extends StoredTrip {
  tripData?: Trip;
}

export default function HomePage() {
  const [myTrips, setMyTrips] = useState<DisplayTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getMyTrips();
    if (stored.length === 0) {
      setLoading(false);
      return;
    }
    // Fetch latest trip status
    Promise.allSettled(stored.map((t) => getTripById(t.id))).then((results) => {
      const updated: DisplayTrip[] = stored.map((t, i) => {
        const result = results[i];
        return {
          ...t,
          tripData: result.status === 'fulfilled' ? result.value.data.trip : undefined,
        };
      });
      setMyTrips(updated);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              นัดวันเที่ยว...<br />ให้ตรงกัน
            </h1>
            <p className="text-primary-100 text-lg mb-8">
              นัดวันเที่ยวให้ตรงกัน เพราะทุกคนควรมีวันที่สะดวก
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/trips/create" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                + สร้างทริปใหม่
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '📅', title: 'สร้างทริปง่าย', desc: 'ตั้งชื่อ เลือกช่วงวัน แชร์ลิงก์' },
            { icon: '🗳️', title: 'เลือกวันว่างได้', desc: 'ว่าง / อาจจะว่าง / ไม่ว่าง พร้อมช่วงเวลา' },
            { icon: '✅', title: 'ระบบหาวันตรงกัน', desc: 'คำนวณและจัดอันดับวันที่ดีที่สุด' },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* My Trips */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ทริปของฉัน</h2>
          {loading ? (
            <div className="card text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
              <p>กำลังโหลด...</p>
            </div>
          ) : myTrips.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีทริป</h3>
              <p className="text-gray-400 mb-6">เริ่มสร้างทริปแรกของคุณได้เลย!</p>
              <Link href="/trips/create" className="btn-primary inline-flex">
                + สร้างทริปใหม่
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrips.map((t) =>
                t.tripData ? (
                  <TripCard key={t.id} trip={t.tripData} role={t.role} />
                ) : (
                  <div key={t.id} className="card opacity-60">
                    <p className="text-sm text-gray-500">📋 {t.title} (โหลดไม่สำเร็จ)</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
