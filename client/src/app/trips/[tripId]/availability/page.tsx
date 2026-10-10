'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { getTripById, getAvailability, saveAvailability, type Trip, type AvailabilityResponse } from '@/services/api';
import { getParticipantToken } from '@/utils/storage';
import { formatThaiDate, formatThaiDayOfWeek, getDatesInRange, TIME_SLOTS, type TimeSlotKey } from '@/utils/date';

type AvailStatus = 'AVAILABLE' | 'MAYBE' | 'UNAVAILABLE' | 'NO_RESPONSE';

interface DaySelection {
  date: string;
  status: AvailStatus;
  timeSlots: TimeSlotKey[];
}

export default function AvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const participantToken = getParticipantToken(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selections, setSelections] = useState<Record<string, DaySelection>>({});

  useEffect(() => {
    if (!participantToken) {
      toast.error('ไม่พบสิทธิ์การแก้ไข กรุณาเข้าร่วมทริปใหม่');
      router.push(`/trips/${tripId}`);
      return;
    }

    const load = async () => {
      try {
        const [tripRes, availRes] = await Promise.all([
          getTripById(tripId),
          getAvailability(tripId),
        ]);
        
        const t = tripRes.data.trip;
        if (t.votingClosed) {
          toast.error('ทริปนี้ปิดรับโหวตแล้ว');
          router.push(`/trips/${tripId}`);
          return;
        }
        
        setTrip(t);
        
        // Initialize selections for all dates in range
        const dates = getDatesInRange(t.startDate, t.endDate);
        const initialSelections: Record<string, DaySelection> = {};
        
        // Find my existing responses (we need my participant ID, which we get by matching token... 
        // wait, we don't have participant ID locally easily, but we can just find responses 
        // that belong to us if we returned it, or we just rely on the API.
        // For MVP, we'll just initialize empty. If they had previous answers, they overwrite.
        // In a real app, backend would return a flag `isMe` on the responses. 
        // Since we didn't add `isMe`, we'll let them overwrite for now.
        
        dates.forEach(d => {
          initialSelections[d] = {
            date: d,
            status: 'NO_RESPONSE',
            timeSlots: [],
          };
        });
        
        setSelections(initialSelections);
      } catch {
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, participantToken, router]);

  const handleStatusChange = (date: string, status: AvailStatus) => {
    setSelections(prev => ({
      ...prev,
      [date]: { ...prev[date], status, timeSlots: status === 'UNAVAILABLE' || status === 'NO_RESPONSE' ? [] : prev[date].timeSlots }
    }));
  };

  const toggleTimeSlot = (date: string, slot: TimeSlotKey) => {
    setSelections(prev => {
      const current = prev[date].timeSlots;
      const updated = current.includes(slot) 
        ? current.filter(s => s !== slot)
        : [...current, slot];
      return {
        ...prev,
        [date]: { ...prev[date], timeSlots: updated }
      };
    });
  };

  const handleSave = async () => {
    if (!participantToken) return;
    
    // Filter out NO_RESPONSE before sending
    const responsesToSend = Object.values(selections)
      .filter(s => s.status !== 'NO_RESPONSE')
      .map(s => ({
        date: new Date(s.date).toISOString(), // Backend expects ISO string date format
        status: s.status as 'AVAILABLE' | 'MAYBE' | 'UNAVAILABLE',
        timeSlots: s.timeSlots,
      }));

    if (responsesToSend.length === 0) {
      toast.error('กรุณาเลือกวันว่างอย่างน้อย 1 วัน');
      return;
    }

    setSaving(true);
    try {
      await saveAvailability(tripId, {
        participantToken,
        responses: responsesToSend,
      });
      toast.success('บันทึกวันว่างสำเร็จ! 🎉');
      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar /><PageLoader text="กำลังเตรียมตาราง..." /></>;
  if (error || !trip) return <><Navbar /><div className="p-6"><ErrorAlert message={error} /></div></>;

  const dates = getDatesInRange(trip.startDate, trip.endDate);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-2 block">
            ← กลับ
          </button>
          <h1 className="text-2xl font-bold text-gray-900">เลือกวันว่างของคุณ</h1>
          <p className="text-gray-500 mt-1">เลือกวันที่และช่วงเวลาที่คุณสะดวกสำหรับ "{trip.title}"</p>
        </div>

        <div className="space-y-6">
          {dates.map((date) => {
            const sel = selections[date];
            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-lg text-gray-900">{formatThaiDate(date)}</span>
                    <span className="ml-2 text-sm text-gray-500">({formatThaiDayOfWeek(date)})</span>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { val: 'AVAILABLE', label: 'ว่างแน่นอน', color: 'bg-green-100 text-green-800 border-green-200' },
                    { val: 'MAYBE', label: 'อาจจะว่าง', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                    { val: 'UNAVAILABLE', label: 'ไม่ว่าง', color: 'bg-red-100 text-red-700 border-red-200' },
                    { val: 'NO_RESPONSE', label: 'ยังไม่ระบุ', color: 'bg-gray-100 text-gray-600 border-gray-200' },
                  ].map(s => (
                    <button
                      key={s.val}
                      onClick={() => handleStatusChange(date, s.val as AvailStatus)}
                      className={`py-2 px-1 text-sm font-medium rounded-xl border transition-all ${
                        sel.status === s.val ? s.color + ' ring-2 ring-offset-1 ring-primary-300 scale-[1.02]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Time Slots (only if available or maybe) */}
                {(sel.status === 'AVAILABLE' || sel.status === 'MAYBE') && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">ระบุช่วงเวลา (เลือกได้มากกว่า 1)</p>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map(slot => {
                        const isSelected = sel.timeSlots.includes(slot.key);
                        return (
                          <button
                            key={slot.key}
                            onClick={() => toggleTimeSlot(date, slot.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                              isSelected 
                                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{slot.emoji}</span>
                            <span>{slot.label}</span>
                            <span className="text-xs opacity-70">({slot.time})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky save button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-3xl mx-auto flex justify-end gap-3">
            <button onClick={() => router.back()} className="btn-secondary">
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[140px]">
              {saving ? 'กำลังบันทึก...' : '💾 บันทึกวันว่าง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add PageLoader here since we used it
function PageLoader({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text || 'กำลังโหลด...'} />
    </div>
  );
}
