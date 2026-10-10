'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { getBestMatches, type Trip, type DayMatch } from '@/services/api';
import { formatThaiDate, formatThaiDayOfWeek, TIME_SLOTS } from '@/utils/date';

export default function BestMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [matches, setMatches] = useState<DayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBestMatches(tripId);
        setTrip(res.data.trip);
        setTotalParticipants(res.data.totalParticipants);
        setMatches(res.data.matches);
      } catch {
        setError('ไม่สามารถโหลดข้อมูลการจัดอันดับได้');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  if (loading) return <><Navbar /><div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="กำลังคำนวณวันว่าง..." /></div></>;
  if (error || !trip) return <><Navbar /><div className="p-6"><ErrorAlert message={error} /></div></>;

  const hasEveryone = matches.some(m => m.allAvailable);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-2 block">
              ← กลับ
            </button>
            <h1 className="text-2xl font-bold text-gray-900">ผลการหาวันที่ตรงกัน</h1>
            <p className="text-gray-500 mt-1">จากสมาชิกทั้งหมด {totalParticipants} คน</p>
          </div>
        </div>

        {totalParticipants === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">ยังไม่มีสมาชิกในทริปนี้</p>
          </div>
        ) : (
          <>
            {/* Summary Banner */}
            {hasEveryone ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                <div className="text-3xl">🎉</div>
                <div>
                  <h3 className="font-bold text-green-900">พบวันที่ทุกคนสะดวกแล้ว!</h3>
                  <p className="text-green-700 text-sm mt-1">
                    มีวันที่ทุกคนในกลุ่ม ({totalParticipants} คน) ระบุว่าว่างตรงกัน
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-bold text-amber-900">ยังไม่มีวันที่ทุกคนว่างตรงกัน</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    ระบบได้จัดอันดับวันที่มีคนว่างมากที่สุดไว้ด้านล่างนี้
                  </p>
                </div>
              </div>
            )}

            {/* Matches List */}
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={match.date} className="card relative overflow-hidden">
                  {/* Rank Badge */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-orange-300' : 'bg-primary-100'
                  }`} />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-lg text-gray-900">
                          อันดับ {index + 1}: {formatThaiDate(match.date)}
                        </span>
                        <span className="text-sm text-gray-500">({formatThaiDayOfWeek(match.date)})</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-3">
                        <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-md">
                          <span className="font-medium">✓ ว่าง: {match.availableCount}</span>
                        </div>
                        {match.maybeCount > 0 && (
                          <div className="flex items-center gap-1.5 text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md">
                            <span className="font-medium">~ อาจจะว่าง: {match.maybeCount}</span>
                          </div>
                        )}
                        {match.unavailableCount > 0 && (
                          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-md">
                            <span className="font-medium">✕ ไม่ว่าง: {match.unavailableCount}</span>
                          </div>
                        )}
                        {match.noResponseCount > 0 && (
                          <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                            <span className="font-medium">— ยังไม่ตอบ: {match.noResponseCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Time slot breakdown if any available/maybe */}
                      {(match.availableCount > 0 || match.maybeCount > 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-600">
                          <span className="font-medium text-gray-700">ช่วงเวลาที่มีคนสะดวก:</span>
                          {TIME_SLOTS.map(slot => {
                            const summary = match.timeSlotSummary[slot.key as keyof typeof match.timeSlotSummary];
                            const total = summary.available + summary.maybe;
                            if (total === 0) return null;
                            return (
                              <span key={slot.key} className="bg-gray-100 px-2 py-0.5 rounded">
                                {slot.label} ({total})
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
