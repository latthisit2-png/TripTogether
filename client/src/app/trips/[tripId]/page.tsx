'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { getTripById, getAvailability, closeVoting, openVoting, type Trip, type Participant, type AvailabilityResponse } from '@/services/api';
import { getOwnerToken, getParticipantToken } from '@/utils/storage';
import { formatThaiDate, formatThaiDayOfWeek, getDatesInRange } from '@/utils/date';

const STATUS_MAP = {
  OPEN: { label: 'กำลังเปิดโหวต', color: 'badge-open', emoji: '🗳️' },
  CONFIRMED: { label: 'ยืนยันวันแล้ว', color: 'badge-confirmed', emoji: '✅' },
  CLOSED: { label: 'ปิดโหวตแล้ว', color: 'badge-closed', emoji: '🔒' },
};

const AVAIL_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-800',
  MAYBE: 'bg-yellow-100 text-yellow-800',
  UNAVAILABLE: 'bg-red-100 text-red-700',
  NO_RESPONSE: 'bg-gray-100 text-gray-500',
};

const AVAIL_LABELS = {
  AVAILABLE: '✓ ว่าง',
  MAYBE: '~ อาจว่าง',
  UNAVAILABLE: '✕ ไม่ว่าง',
  NO_RESPONSE: '— ยังไม่ตอบ',
};

export default function TripDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = params.tripId as string;
  const isNewlyCreated = searchParams.get('created') === '1';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(isNewlyCreated);
  const [activeTab, setActiveTab] = useState<'detail' | 'availability' | 'matches'>('detail');

  const ownerToken = getOwnerToken(tripId);
  const participantToken = getParticipantToken(tripId);
  const isOwner = !!ownerToken;

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [tripRes, availRes] = await Promise.all([
        getTripById(tripId),
        getAvailability(tripId),
      ]);
      setTrip(tripRes.data.trip);
      setParticipants(tripRes.data.participants);
      setResponses(availRes.data.responses);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลทริปได้');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const copyInviteLink = () => {
    if (!trip) return;
    const url = `${window.location.origin}/join/${trip.inviteToken}`;
    navigator.clipboard.writeText(url);
    toast.success('คัดลอกลิงก์แล้ว!');
  };

  const handleCloseVoting = async () => {
    if (!ownerToken) return;
    setActionLoading(true);
    try {
      await closeVoting(tripId, ownerToken);
      toast.success('ปิดรับโหวตแล้ว');
      await load();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVoting = async () => {
    if (!ownerToken) return;
    setActionLoading(true);
    try {
      await openVoting(tripId, ownerToken);
      toast.success('เปิดรับโหวตแล้ว');
      await load();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner text="กำลังโหลดทริป..." /></>;
  if (error) return <><Navbar /><div className="max-w-xl mx-auto p-6"><ErrorAlert message={error} onRetry={load} /></div></>;
  if (!trip) return null;

  const statusConfig = STATUS_MAP[trip.status];
  const dates = getDatesInRange(trip.startDate, trip.endDate);
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${trip.inviteToken}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Share Banner */}
        {showShareBanner && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-green-800">🎉 สร้างทริปสำเร็จ!</p>
              <p className="text-sm text-green-700 mt-1">แชร์ลิงก์นี้ให้เพื่อนเพื่อเชิญเข้าร่วม</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="text-xs bg-white border border-green-200 rounded px-2 py-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {inviteUrl}
                </code>
                <button onClick={copyInviteLink} className="btn-primary text-sm py-1.5 px-3 whitespace-nowrap">
                  คัดลอก
                </button>
              </div>
            </div>
            <button onClick={() => setShowShareBanner(false)} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Trip Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={statusConfig.color}>{statusConfig.emoji} {statusConfig.label}</span>
                {isOwner && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">ผู้สร้าง</span>}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
              {trip.description && <p className="text-gray-500 mt-1">{trip.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span>📅 {formatThaiDate(trip.startDate)} – {formatThaiDate(trip.endDate)}</span>
                {trip.location && <span>📍 {trip.location}</span>}
                <span>👥 {participants.length} คน</span>
              </div>
              {trip.confirmedDate && (
                <div className="mt-3 bg-primary-50 border border-primary-200 rounded-xl p-3">
                  <p className="font-semibold text-primary-800">🎉 วันที่นัด: {formatThaiDate(trip.confirmedDate)}</p>
                  {trip.confirmedTimeSlots && (trip.confirmedTimeSlots as string[]).length > 0 && (
                    <p className="text-sm text-primary-700 mt-1">
                      ช่วงเวลา: {(trip.confirmedTimeSlots as string[]).map((s) =>
                        s === 'morning' ? 'เช้า' : s === 'afternoon' ? 'บ่าย' : 'เย็น'
                      ).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={copyInviteLink} className="btn-secondary text-sm py-2">
                🔗 คัดลอกลิงก์เชิญ
              </button>
              {!participantToken && !isOwner && (
                <Link href={`/join/${trip.inviteToken}`} className="btn-primary text-sm py-2 text-center">
                  เข้าร่วมทริป
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
          {[
            { key: 'detail', label: '📋 สมาชิก' },
            { key: 'availability', label: '📊 ตารางวันว่าง' },
            { key: 'matches', label: '🏆 วันที่ดีที่สุด' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Members */}
        {activeTab === 'detail' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">👥 รายชื่อสมาชิก ({participants.length} คน)</h2>
              {participants.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">ยังไม่มีสมาชิก แชร์ลิงก์เชิญเพื่อน!</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {p.displayName[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{p.displayName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Controls */}
            {isOwner && (
              <div className="card bg-amber-50 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-3">⚙️ จัดการทริป (ผู้สร้างเท่านั้น)</h3>
                <div className="flex flex-wrap gap-3">
                  {trip.status !== 'CONFIRMED' && (
                    <Link
                      href={`/trips/${tripId}/confirm`}
                      className="btn-primary text-sm py-2"
                    >
                      ✅ ยืนยันวันนัด
                    </Link>
                  )}
                  {!trip.votingClosed ? (
                    <button
                      onClick={handleCloseVoting}
                      disabled={actionLoading}
                      className="btn-danger text-sm py-2"
                    >
                      🔒 ปิดรับโหวต
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenVoting}
                      disabled={actionLoading}
                      className="btn-secondary text-sm py-2"
                    >
                      🔓 เปิดรับโหวตอีกครั้ง
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Participant: select availability */}
            {participantToken && !trip.votingClosed && (
              <Link
                href={`/trips/${tripId}/availability`}
                className="card bg-primary-50 border border-primary-200 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-primary-800">เลือกวันว่างของคุณ</p>
                  <p className="text-sm text-primary-600 mt-0.5">คลิกเพื่อเลือกหรือแก้ไขวันว่าง</p>
                </div>
                <span className="text-primary-600 text-xl">→</span>
              </Link>
            )}
            {trip.votingClosed && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-500 text-sm">
                🔒 ปิดรับการโหวตแล้ว ไม่สามารถแก้ไขคำตอบได้
              </div>
            )}
          </div>
        )}

        {/* Tab: Availability Grid */}
        {activeTab === 'availability' && (
          <div className="card overflow-x-auto">
            <h2 className="font-semibold text-gray-900 mb-4">📊 ตารางวันว่างของกลุ่ม</h2>
            {participants.length === 0 ? (
              <p className="text-gray-400 text-center py-8">ยังไม่มีสมาชิก</p>
            ) : (
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700 sticky left-0 bg-white">สมาชิก</th>
                    {dates.map((d) => (
                      <th key={d} className="text-center py-2 px-2 font-medium text-gray-600 whitespace-nowrap">
                        <div>{formatThaiDayOfWeek(d).slice(0, 3)}</div>
                        <div className="text-xs text-gray-400">{formatThaiDate(d)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-t border-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-800 sticky left-0 bg-white whitespace-nowrap">
                        {p.displayName}
                      </td>
                      {dates.map((d) => {
                        const resp = responses.find(
                          (r) => r.participantId === p.id && r.date.startsWith(d)
                        );
                        const key = resp ? resp.status : 'NO_RESPONSE';
                        return (
                          <td key={d} className="text-center py-2 px-1">
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${AVAIL_COLORS[key as keyof typeof AVAIL_COLORS]}`}>
                              {AVAIL_LABELS[key as keyof typeof AVAIL_LABELS]}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Best Matches - link to dedicated page */}
        {activeTab === 'matches' && (
          <div className="card text-center py-10">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="font-semibold text-gray-800 mb-2">ดูวันที่ดีที่สุด</h3>
            <p className="text-gray-500 text-sm mb-4">ระบบจะคำนวณวันที่เหมาะสมจากคำตอบของทุกคน</p>
            <Link href={`/trips/${tripId}/matches`} className="btn-primary">
              ดูผลการจับคู่วัน →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
