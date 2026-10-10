'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import { createTrip } from '@/services/api';
import { saveOwnerToken, saveMyTrip } from '@/utils/storage';
import { toISODate } from '@/utils/date';

export default function CreateTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('กรุณากรอกชื่อทริป');
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('กรุณาระบุช่วงวันที่');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น');
      return;
    }

    setLoading(true);
    try {
      const res = await createTrip({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      const { trip, ownerToken, inviteToken } = res.data;
      saveOwnerToken(trip.id, ownerToken);
      saveMyTrip({
        id: trip.id,
        title: trip.title,
        inviteToken,
        ownerToken,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      });

      toast.success('สร้างทริปสำเร็จ! 🎉');
      router.push(`/trips/${trip.id}?created=1`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const today = toISODate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">สร้างทริปใหม่</h1>
          <p className="text-gray-500 mt-1">กรอกรายละเอียดทริปที่ต้องการนัด</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Title */}
          <div>
            <label className="label">
              ชื่อทริป <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="เช่น เที่ยวทะเล สงกรานต์ 2025"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">รายละเอียด (ไม่จำเป็น)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="เพิ่มรายละเอียด หรือโน้ตสำหรับเพื่อน..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={1000}
            />
          </div>

          {/* Location */}
          <div>
            <label className="label">สถานที่ (ไม่จำเป็น)</label>
            <input
              type="text"
              className="input"
              placeholder="เช่น เกาะสมุย, เชียงใหม่"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              maxLength={300}
            />
          </div>

          {/* Date range */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
            <h3 className="font-semibold text-primary-900 mb-1">📅 กำหนดช่วงเวลาที่จะให้เพื่อนโหวต</h3>
            <p className="text-xs text-primary-600 mb-4">
              กำหนด "กรอบเวลาคร่าวๆ" เพื่อสร้างปฏิทินให้เพื่อนเข้ามาเลือกวันที่ตัวเองว่าง (เช่น ตลอดเดือนหน้า หรือช่วงวันหยุดยาว)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  เริ่มต้นช่วงที่ให้โหวต <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input bg-white"
                  min={today}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">
                  สิ้นสุดช่วงที่ให้โหวต <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input bg-white"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base py-3.5"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              '✈️ สร้างทริป'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
