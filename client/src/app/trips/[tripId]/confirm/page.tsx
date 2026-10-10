'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { getBestMatches, confirmTrip, type Trip, type DayMatch } from '@/services/api';
import { getOwnerToken } from '@/utils/storage';
import { formatThaiDate, formatThaiDayOfWeek, TIME_SLOTS, toISODate, getDatesInRange } from '@/utils/date';

export default function ConfirmTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const ownerToken = getOwnerToken(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [matches, setMatches] = useState<DayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!ownerToken) {
      toast.error('คุณไม่มีสิทธิ์ยืนยันวันนัด');
      router.push(`/trips/${tripId}`);
      return;
    }

    const load = async () => {
      try {
        const res = await getBestMatches(tripId);
        if (res.data.trip.status === 'CONFIRMED') {
          toast.error('ทริปนี้ถูกยืนยันไปแล้ว');
          router.push(`/trips/${tripId}`);
          return;
        }
        setTrip(res.data.trip);
        setMatches(res.data.matches);
        
        // Pre-select top match if available
        if (res.data.matches.length > 0) {
          const topMatch = res.data.matches[0];
          setSelectedDate(topMatch.date);
          
          // Auto select time slots that have at least 1 person available
          const slots: string[] = [];
          TIME_SLOTS.forEach(s => {
            const sum = topMatch.timeSlotSummary[s.key as keyof typeof topMatch.timeSlotSummary];
            if (sum.available > 0) slots.push(s.key);
          });
          setSelectedSlots(slots);
        } else {
           // Fallback to start date
           setSelectedDate(toISODate(new Date(res.data.trip.startDate)));
        }
      } catch {
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, ownerToken, router]);

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleConfirm = async () => {
    if (!selectedDate) {
      toast.error('กรุณาเลือกวันที่จะนัดหมาย');
      return;
    }
    if (!ownerToken) return;

    setSaving(true);
    try {
      await confirmTrip(tripId, {
        ownerToken,
        confirmedDate: new Date(selectedDate).toISOString(),
        confirmedTimeSlots: selectedSlots,
      });
      toast.success('ยืนยันวันนัดหมายสำเร็จ!');
      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar /><div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="กำลังโหลด..." /></div></>;
  if (error || !trip) return <><Navbar /><div className="p-6"><ErrorAlert message={error} /></div></>;

  const dates = getDatesInRange(trip.startDate, trip.endDate);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-2 block">
            ← กลับ
          </button>
          <h1 className="text-2xl font-bold text-gray-900">ยืนยันวันนัดหมาย</h1>
          <p className="text-gray-500 mt-1">เลือกวันที่ดีที่สุดและช่วงเวลาเพื่อยืนยันกับทุกคน</p>
        </div>

        <div className="card space-y-6">
          {/* Rank info */}
          {matches.length > 0 && selectedDate === matches[0].date && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm flex items-center gap-2">
              <span>🏆</span> วันที่คุณเลือกคือวันที่ตรงกันมากที่สุดอันดับ 1
            </div>
          )}

          {/* Select Date */}
          <div>
            <label className="label text-base">เลือกวันที่</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {dates.map(date => {
                const match = matches.find(m => m.date === date);
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-primary-50 border-primary-400 ring-1 ring-primary-400' 
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{formatThaiDate(date)}</div>
                    <div className="text-xs text-gray-500">{formatThaiDayOfWeek(date)}</div>
                    {match && (
                      <div className="mt-2 text-xs flex gap-2">
                        <span className="text-green-600">✓ {match.availableCount}</span>
                        <span className="text-red-600">✕ {match.unavailableCount}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Time Slots */}
          <div className="pt-4 border-t border-gray-100">
            <label className="label text-base mb-3">ช่วงเวลาที่นัดหมาย</label>
            <div className="space-y-2">
              {TIME_SLOTS.map(slot => {
                const isSelected = selectedSlots.includes(slot.key);
                return (
                  <button
                    key={slot.key}
                    onClick={() => toggleSlot(slot.key)}
                    className={`w-full flex items-center justify-between p-3 border rounded-xl transition-colors ${
                      isSelected 
                        ? 'bg-primary-50 border-primary-300 text-primary-800' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{slot.emoji}</span>
                      <span className="font-medium">{slot.label} <span className="text-sm font-normal opacity-75 ml-1">({slot.time})</span></span>
                    </div>
                    {isSelected && <span className="text-primary-600 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-xl mx-auto flex justify-end gap-3">
            <button onClick={() => router.back()} className="btn-secondary">ยกเลิก</button>
            <button onClick={handleConfirm} disabled={saving || !selectedDate} className="btn-primary min-w-[140px]">
              {saving ? 'กำลังยืนยัน...' : '✅ ยืนยันวันนัดหมาย'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
