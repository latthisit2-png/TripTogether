'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import { joinTrip } from '@/services/api';
import { saveParticipantToken, saveMyTrip } from '@/utils/storage';

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const inviteToken = params.inviteToken as string;

  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('กรุณากรอกชื่อ');
      return;
    }

    setLoading(true);
    try {
      // Find trip ID by invite token first (we need it for the URL and storage)
      // Actually, our API takes tripId for joining, but we only have inviteToken here.
      // Let's fetch trip by inviteToken first.
      const { getTripByInviteToken } = await import('@/services/api');
      const tripRes = await getTripByInviteToken(inviteToken);
      const trip = tripRes.data.trip;

      // Join the trip
      const joinRes = await joinTrip(trip.id, {
        displayName: displayName.trim(),
        inviteToken,
      });

      const { participant, participantToken } = joinRes.data;
      
      saveParticipantToken(trip.id, participantToken);
      saveMyTrip({
        id: trip.id,
        title: trip.title,
        inviteToken,
        participantId: participant.id,
        participantToken,
        role: 'participant',
        joinedAt: new Date().toISOString(),
      });

      toast.success('เข้าร่วมทริปสำเร็จ!');
      router.push(`/trips/${trip.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">👋</span>
            <h1 className="text-2xl font-bold text-gray-900">เข้าร่วมทริป</h1>
            <p className="text-gray-500 mt-1">กรอกชื่อของคุณเพื่อเข้าร่วมและเลือกวันว่าง</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="label">ชื่อที่ใช้แสดงในกลุ่ม <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="เช่น เมย์, อาร์ม"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมทริป'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
