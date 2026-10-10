'use client';
import { Trip } from '@/services/api';
import Link from 'next/link';
import { formatThaiDate } from '@/utils/date';

interface TripCardProps {
  trip: Trip;
  role: 'owner' | 'participant';
}

const STATUS_CONFIG = {
  OPEN: { label: 'กำลังเปิดโหวต', className: 'badge-open', emoji: '🗳️' },
  CONFIRMED: { label: 'ยืนยันวันแล้ว', className: 'badge-confirmed', emoji: '✅' },
  CLOSED: { label: 'ปิดโหวตแล้ว', className: 'badge-closed', emoji: '🔒' },
};

export default function TripCard({ trip, role }: TripCardProps) {
  const config = STATUS_CONFIG[trip.status];
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="card hover:shadow-md transition-shadow block group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
            {trip.title}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
            <span>📅 {formatThaiDate(trip.startDate)} – {formatThaiDate(trip.endDate)}</span>
            {trip.location && <span>📍 {trip.location}</span>}
          </div>
          {trip.confirmedDate && (
            <p className="mt-1 text-sm text-primary-700 font-medium">
              🎉 นัดวัน {formatThaiDate(trip.confirmedDate)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={config.className}>
            {config.emoji} {config.label}
          </span>
          {role === 'owner' && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ผู้สร้าง
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
