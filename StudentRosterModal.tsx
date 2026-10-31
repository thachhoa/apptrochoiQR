import React, { useState } from 'react';
import { X, Users, ClipboardList, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Language } from '../types';

interface StudentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNames: string[];
  lang: Language;
  onUpdateNames: (names: string[]) => void;
}

export const StudentRosterModal: React.FC<StudentRosterModalProps> = ({
  isOpen,
  onClose,
  currentNames,
  lang: _lang,
  onUpdateNames,
}) => {
  const [text, setText] = useState<string>(currentNames.join('\n'));
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedNames = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const count = parsedNames.length;
  const currentCount = currentNames.length;
  const isCountMismatch = count !== currentCount;

  const handleApply = () => {
    if (count === 0) {
      setError('Danh sách trống. Vui lòng nhập ít nhất 1 tên học sinh.');
      return;
    }
    if (count !== currentCount) {
      setError(
        `Số tên (${count}) không khớp với sĩ số lớp (${currentCount}). Vui lòng điều chỉnh sĩ số trong phần "Sĩ số lớp" hoặc thêm/bớt tên cho đúng.`
      );
      return;
    }
    setError(null);
    onUpdateNames(parsedNames);
    onClose();
  };

  const handleLoadSample = () => {
    const sample = Array.from({ length: currentCount }, (_, i) => `Học sinh ${i + 1}`).join('\n');
    setText(sample);
    setError(null);
  };

  const handleExportTemplate = () => {
    const lines = Array.from({ length: currentCount }, (_, i) => `Học sinh ${i + 1}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_hoc_sinh.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-blue-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-base font-black font-['Fredoka']">Danh Sách Tên Học Sinh</h3>
              <p className="text-xs text-blue-200">Nhập tên thật để thay thế tên mặc định</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Instructions */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-semibold flex gap-2">
            <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              Nhập <strong>mỗi tên học sinh trên một dòng</strong>. Có thể copy-paste trực tiếp từ file danh sách (cột tên trong Excel, Google Sheets).
              <br />
              <span className="text-blue-600">Cần đúng <strong>{currentCount} tên</strong> khớp với sĩ số lớp hiện tại.</span>
            </div>
          </div>

          {/* Counter badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Đang nhập: <strong className={isCountMismatch && count > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {count} tên
              </strong> / cần {currentCount} tên
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleLoadSample}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 underline"
              >
                Đặt lại tên mặc định
              </button>
              <button
                onClick={handleExportTemplate}
                title="Tải file mẫu .txt"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={12}
            className="w-full p-3.5 rounded-2xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm font-medium resize-none transition-all"
            placeholder={`Nguyễn Văn A\nTrần Thị B\nLê Văn C\n...`}
          />

          {/* Preview */}
          {count > 0 && count <= 5 && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700 mb-1.5">Xem trước ({count} học sinh):</p>
              <div className="flex flex-wrap gap-1.5">
                {parsedNames.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-slate-700"
                  >
                    {i + 1}. {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success hint when count matches */}
          {!isCountMismatch && count > 0 && !error && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sẵn sàng! {count} tên khớp với sĩ số lớp.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Áp Dụng Danh Sách</span>
          </button>
        </div>
      </div>
    </div>
  );
};
