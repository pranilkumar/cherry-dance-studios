'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaQrcode, FaCheckCircle, FaClock, FaUsers, FaCalendarDay,
  FaCamera, FaDownload, FaMobileAlt, FaBolt, FaTimes,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const DEMO_CLASSES = [
  { id: 1, name: 'Little Stars', time: '5:45 PM – 6:30 PM', instructor: 'Cherry',          capacity: 15, enrolled: 12, status: 'active'   },
  { id: 2, name: 'The Crew',     time: '6:00 PM – 7:00 PM', instructor: 'Pranil',          capacity: 18, enrolled: 16, status: 'upcoming' },
  { id: 3, name: 'Slay Squad',   time: '7:00 PM – 8:00 PM', instructor: 'Cherry & Pranil', capacity: 20, enrolled: 14, status: 'upcoming' },
];

const DEMO_ATTENDANCE = [
  { id: 1, studentName: 'Aanya Sharma',   className: 'Little Stars', time: '5:42 PM', status: 'on-time', method: 'QR Scan' },
  { id: 2, studentName: 'Maria Garcia',   className: 'Little Stars', time: '5:48 PM', status: 'late',    method: 'QR Scan' },
  { id: 3, studentName: 'Jaden Thompson', className: 'Little Stars', time: '5:40 PM', status: 'on-time', method: 'Manual' },
];

const STATUS_BADGE = {
  'on-time': { bg: '#ffffff', fg: '#0a0a0f', label: 'On time' },
  late:      { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', label: 'Late' },
  absent:    { bg: '#d1060f', fg: '#ffffff', label: 'Absent' },
};

const CLASS_STATUS_BADGE = {
  active:   { bg: '#d1060f', fg: '#ffffff', label: 'Live now' },
  upcoming: { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', label: 'Upcoming' },
  done:     { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Finished' },
};

export default function AttendanceSystem() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, late: 0, totalClasses: 0 });
  const videoRef = useRef(null);

  useEffect(() => {
    setAttendanceData(DEMO_ATTENDANCE);
    setTodayStats({ present: 28, late: 3, absent: 5, totalClasses: 3 });
  }, []);

  const generateQRCode = (classData) =>
    JSON.stringify({
      classId: classData.id,
      className: classData.name,
      timestamp: new Date().toISOString(),
      sessionId: `CLS-${classData.id}-${Date.now()}`,
    });

  const handleGenerateQR = (c) => {
    setSelectedClass(c);
    setShowQRModal(true);
    toast.success(`QR generated for ${c.name}`);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('attendance-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${selectedClass.name}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded.');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
      }
    } catch {
      toast.error('Camera access denied.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setScannerActive(false);
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Attendance
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Class check-in.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Generate per-class QR codes for contactless check-in.
          </p>
        </div>
        <button
          type="button"
          onClick={startScanner}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:border-white/30"
        >
          <FaCamera className="text-xs" />
          Open scanner
        </button>
      </header>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/65 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#d1060f]" />
        Demo data — not yet wired to real classes / attendance tables.
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={FaCheckCircle} label="Present today" value={todayStats.present} />
        <StatCard icon={FaClock}       label="Late arrivals"  value={todayStats.late}    featured />
        <StatCard icon={FaUsers}       label="Absent"         value={todayStats.absent}  featured />
        <StatCard icon={FaCalendarDay} label="Classes today"  value={todayStats.totalClasses} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
              <FaBolt className="text-[#ee2435]" /> Today&rsquo;s classes
            </h2>
          </header>
          <div className="divide-y divide-white/8">
            {DEMO_CLASSES.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <ClassStatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                    <span className="flex items-center gap-1"><FaClock className="text-[10px]" /> {c.time}</span>
                    <span className="flex items-center gap-1"><FaUsers className="text-[10px]" /> {c.enrolled} / {c.capacity}</span>
                    <span>with {c.instructor}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateQR(c)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/85 hover:border-[#d1060f] hover:text-[#ee2435]"
                >
                  <FaQrcode className="text-[10px]" /> QR code
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
              Recent check-ins
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1060f]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d1060f] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d1060f]" />
              </span>
              Live
            </span>
          </header>
          <div className="divide-y divide-white/8">
            <AnimatePresence>
              {attendanceData.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.04]"
                >
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-xs font-bold text-[#ee2435]">
                    {r.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{r.studentName}</p>
                    <p className="truncate text-xs text-white/55">{r.className}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40">
                      {r.method === 'QR Scan' ? <FaQrcode /> : <FaCheckCircle />}
                      {r.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <AttendanceStatusBadge status={r.status} />
                    <p className="mt-1 text-xs text-white/55 tabular-nums">{r.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureBox icon={FaQrcode}    title="QR Code check-in" text="Fast contactless attendance via per-session QR codes." />
        <FeatureBox icon={FaCamera}    title="Camera scanner"   text="Built-in scanner mode for at-the-door check-in." />
        <FeatureBox icon={FaMobileAlt} title="Mobile-friendly"   text="Parents save QR codes to their phone for one-tap entry." />
      </div>

      {showQRModal && selectedClass && (
        <Modal title="Class QR Code" onClose={() => setShowQRModal(false)}>
          <div className="text-center">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              {selectedClass.name}
            </h3>
            <p className="mt-1 text-sm text-white/55">
              {selectedClass.time} · {selectedClass.instructor}
            </p>

            <div className="mx-auto mt-6 inline-block rounded-2xl bg-white p-5">
              <QRCodeSVG
                id="attendance-qr"
                value={generateQRCode(selectedClass)}
                size={240}
                level="H"
                bgColor="#ffffff"
                fgColor="#0a0a0f"
                marginSize={0}
              />
            </div>

            <div className="mx-auto mt-5 max-w-sm rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-xs text-white/75">
              Students scan this QR to check in. Code expires in 30 minutes.
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
              >
                <FaDownload className="text-xs" />
                Download
              </button>
            </div>
          </div>
        </Modal>
      )}

      {scannerActive && (
        <Modal title="Scan QR Code" onClose={stopScanner} size="lg">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} autoPlay playsInline className="block w-full" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-56 w-56 rounded-2xl border-2 border-[#ee2435] shadow-[0_0_0_999px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/55">
            Position the QR code within the red frame.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ── primitives ── */

function StatCard({ icon: Icon, label, value, featured }) {
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-full ${featured ? 'bg-[#d1060f] text-white' : 'bg-white/10 text-white'}`}>
        <Icon className="text-base" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${featured ? 'text-[#ee2435]' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function ClassStatusBadge({ status }) {
  const v = CLASS_STATUS_BADGE[status] || CLASS_STATUS_BADGE.upcoming;
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: v.bg, color: v.fg }}>
      {v.label}
    </span>
  );
}

function AttendanceStatusBadge({ status }) {
  const v = STATUS_BADGE[status] || STATUS_BADGE['on-time'];
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: v.bg, color: v.fg }}>
      {v.label}
    </span>
  );
}

function FeatureBox({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#d1060f]/15 text-[#ee2435]">
        <Icon className="text-base" />
      </div>
      <h4 className="mt-4 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">{title}</h4>
      <p className="mt-1 text-sm text-white/65">{text}</p>
    </div>
  );
}

function Modal({ title, children, onClose, size = 'md' }) {
  const w = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className={`w-full ${w} overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]`}>
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">{title}</h2>
          <button type="button" onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white">
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
