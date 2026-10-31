import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  MessageSquareQuote, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles,
  Clock,
  Pencil,
  Save,
  XCircle,
  ChevronUp
} from 'lucide-react';
import { Question, AnswerOption, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { 
  parseExcelQuestions, 
  parseQuestionsFromPromptText, 
  exportExcelTemplate 
} from '../utils/questionImporter';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';

interface QuestionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onUpdateQuestions: (newQuestions: Question[]) => void;
  lang: Language;
}

const ANSWER_OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D'];

const emptyQuestion = (): Question => ({
  id: `q_${Date.now()}`,
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: 'A',
  timeLimit: 15,
  explanation: '',
});

interface EditFormProps {
  initial: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ initial, onSave, onCancel }) => {
  const [draft, setDraft] = useState<Question>({ ...initial });
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.question.trim()) { setError('Câu hỏi không được để trống.'); return; }
    if (!draft.options.A.trim() || !draft.options.B.trim() || !draft.options.C.trim() || !draft.options.D.trim()) {
      setError('Tất cả 4 đáp án không được để trống.'); return;
    }
    if (draft.timeLimit < 5 || draft.timeLimit > 120) {
      setError('Thời gian phải từ 5 đến 120 giây.'); return;
    }
    setError(null);
    onSave({ ...draft });
  };

  return (
    <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 flex flex-col gap-3">
      {/* Question text */}
      <div>
        <label className="text-[11px] font-black text-purple-700 mb-1 block">Câu hỏi</label>
        <textarea
          value={draft.question}
          onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          rows={2}
          className="w-full p-2.5 rounded-xl border border-purple-200 text-sm font-medium focus:ring-2 focus:ring-purple-300 focus:outline-none resize-none"
          placeholder="Nhập câu hỏi..."
        />
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-2">
        {ANSWER_OPTIONS.map((opt) => (
          <div key={opt}>
            <label className={`text-[11px] font-black mb-1 block ${draft.correctAnswer === opt ? 'text-emerald-600' : 'text-slate-600'}`}>
              Đáp án {opt} {draft.correctAnswer === opt ? '✓ (Đúng)' : ''}
            </label>
            <input
              type="text"
              value={draft.options[opt]}
              onChange={(e) =>
                setDraft((d) => ({ ...d, options: { ...d.options, [opt]: e.target.value } }))
              }
              className={`w-full p-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
                draft.correctAnswer === opt
                  ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-300'
                  : 'border-slate-200 focus:ring-purple-200'
              }`}
              placeholder={`Đáp án ${opt}...`}
            />
          </div>
        ))}
      </div>

      {/* Correct answer + time */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[11px] font-black text-slate-600 mb-1 block">Đáp án đúng</label>
          <div className="flex gap-1.5">
            {ANSWER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setDraft((d) => ({ ...d, correctAnswer: opt }))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
                  draft.correctAnswer === opt
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="w-28">
          <label className="text-[11px] font-black text-slate-600 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Thời gian (giây)
          </label>
          <input
            type="number"
            value={draft.timeLimit}
            onChange={(e) => setDraft((d) => ({ ...d, timeLimit: parseInt(e.target.value) || 15 }))}
            min={5}
            max={120}
            className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-purple-200 focus:outline-none text-center"
          />
        </div>
      </div>

      {/* Explanation (optional) */}
      <div>
        <label className="text-[11px] font-black text-slate-500 mb-1 block">Giải thích (tuỳ chọn)</label>
        <input
          type="text"
          value={draft.explanation ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
          className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-200 focus:outline-none"
          placeholder="Giải thích tại sao đáp án này đúng..."
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
          ⚠ {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
        >
          <XCircle className="w-3.5 h-3.5" />
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-md shadow-emerald-100 transition-all active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          Lưu Câu Hỏi
        </button>
      </div>
    </div>
  );
};

export const QuestionManagerModal: React.FC<QuestionManagerModalProps> = ({
  isOpen,
  onClose,
  questions,
  onUpdateQuestions,
  lang,
}) => {
  const [tab, setTab] = useState<'list' | 'prompt' | 'excel'>('list');
  const [promptInput, setPromptInput] = useState<string>(`Câu 1: Thủ đô của Việt Nam là thành phố nào?\nA. Thành phố Hồ Chí Minh\nB. Đà Nẵng\nC. Hà Nội\nD. Hải Phòng\nĐáp án: C\nThời gian: 15\nGiải thích: Hà Nội là thủ đô ngàn năm văn hiến của nước CHXHCN Việt Nam.\n\nCâu 2: Đơn vị đo cường độ dòng điện trong hệ SI là gì?\nA. Vôn (V)\nB. Ampe (A)\nC. Oát (W)\nD. Ôm (Ω)\nĐáp án: B\nThời gian: 15`);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseExcelQuestions(file);
      if (imported.length > 0) {
        onUpdateQuestions([...imported]);
        setStatusMsg({ type: 'success', text: `Đã nhập thành công ${imported.length} câu hỏi từ file Excel!` });
        setTab('list');
      } else {
        setStatusMsg({ type: 'error', text: 'Không tìm thấy câu hỏi hợp lệ trong file. Hãy kiểm tra các cột theo file mẫu.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Lỗi khi đọc file Excel. Vui lòng thử lại với file .xlsx đúng định dạng.' });
    }
  };

  const handlePromptParse = () => {
    const parsed = parseQuestionsFromPromptText(promptInput);
    if (parsed.length > 0) {
      onUpdateQuestions([...parsed]);
      setStatusMsg({ type: 'success', text: `Đã nhập thành công ${parsed.length} câu hỏi từ nội dung ChatGPT!` });
      setTab('list');
    } else {
      setStatusMsg({ type: 'error', text: 'Không phân tích được câu hỏi nào. Vui lòng kiểm tra định dạng A, B, C, D và Đáp án.' });
    }
  };

  const handleResetSample = () => {
    onUpdateQuestions([...SAMPLE_QUESTIONS]);
    setStatusMsg({ type: 'success', text: 'Đã khôi phục bộ câu hỏi mẫu chuẩn!' });
    setEditingId(null);
    setAddingNew(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) { alert('Phải giữ lại ít nhất 1 câu hỏi trong bộ đề!'); return; }
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSaveEdit = (updated: Question) => {
    onUpdateQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    setEditingId(null);
    setStatusMsg({ type: 'success', text: 'Đã cập nhật câu hỏi thành công!' });
  };

  const handleSaveNew = (newQ: Question) => {
    onUpdateQuestions([...questions, { ...newQ, id: `q_${Date.now()}` }]);
    setAddingNew(false);
    setStatusMsg({ type: 'success', text: 'Đã thêm câu hỏi mới vào bộ đề!' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border-2 border-purple-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-['Fredoka']">
                {getTranslation(lang, 'manageQuestions')} ({questions.length} câu)
              </h3>
              <p className="text-xs text-purple-200">
                Nhập từ Excel, ChatGPT Prompt hoặc chỉnh sửa trực tiếp bộ đề thi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-purple-100 bg-purple-50/50 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-xl transition-all ${
              tab === 'list' ? 'bg-white text-purple-700 shadow-xs border border-purple-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh Sách ({questions.length})
          </button>
          <button
            onClick={() => setTab('excel')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              tab === 'excel' ? 'bg-white text-purple-700 shadow-xs border border-purple-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập từ Excel</span>
          </button>
          <button
            onClick={() => setTab('prompt')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              tab === 'prompt' ? 'bg-white text-purple-700 shadow-xs border border-purple-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
            <span>Nhập từ ChatGPT</span>
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`p-3 text-xs font-bold flex items-center justify-between ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="underline text-[10px]">Đóng</button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* ---- LIST TAB ---- */}
          {tab === 'list' && (
            <div className="space-y-3">
              {/* Top toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Tổng số: {questions.length} câu hỏi trong ngân hàng đề
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetSample}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                  >
                    Nạp lại bộ đề mẫu
                  </button>
                  <button
                    onClick={() => { setAddingNew(true); setEditingId(null); }}
                    disabled={addingNew}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Câu Hỏi Mới
                  </button>
                </div>
              </div>

              {/* Add new form (shown at top) */}
              {addingNew && (
                <EditForm
                  initial={emptyQuestion()}
                  onSave={handleSaveNew}
                  onCancel={() => setAddingNew(false)}
                />
              )}

              {/* Question list */}
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-2xl bg-white border border-purple-100 shadow-xs overflow-hidden">
                  {/* Question card row */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center font-['Fredoka'] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-purple-600">
                          Đáp án đúng:{' '}
                          <strong className="text-emerald-600 font-black text-sm">{q.correctAnswer}</strong>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {q.timeLimit}s
                        </span>
                        {q.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {q.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-2 line-clamp-2">{q.question}</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {ANSWER_OPTIONS.map((opt) => (
                          <span
                            key={opt}
                            className={`px-2 py-1 rounded-lg ${
                              q.correctAnswer === opt
                                ? 'bg-emerald-100 text-emerald-700 font-bold'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {opt}: {q.options[opt]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(editingId === q.id ? null : q.id);
                          setAddingNew(false);
                        }}
                        className={`p-2 rounded-xl transition-colors ${
                          editingId === q.id
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        title="Chỉnh sửa câu hỏi này"
                      >
                        {editingId === q.id ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editingId === q.id && (
                    <div className="px-4 pb-4">
                      <EditForm
                        initial={q}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ---- EXCEL TAB ---- */}
          {tab === 'excel' && (
            <div className="p-6 bg-white rounded-2xl border border-purple-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 mb-1">Nhập Ngân Hàng Câu Hỏi Từ File Excel</h4>
              <p className="text-xs text-slate-500 max-w-md mb-5">
                File Excel cần có các cột: <strong>Câu hỏi, Đáp án A, Đáp án B, Đáp án C, Đáp án D, Đáp án đúng (A/B/C/D), Thời gian</strong>.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 transition-all active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Chọn File Excel (.xlsx / .csv)</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
                </label>
                <button
                  onClick={exportExcelTemplate}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>{getTranslation(lang, 'exportExcel')}</span>
                </button>
              </div>
            </div>
          )}

          {/* ---- PROMPT TAB ---- */}
          {tab === 'prompt' && (
            <div className="bg-white p-5 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-800">Dán Câu Hỏi Từ ChatGPT hoặc Văn Bản</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Hỗ trợ định dạng: "Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: B Thời gian: 15"
              </p>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={10}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                placeholder="Dán nội dung câu hỏi tại đây..."
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={handlePromptParse}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Phân Tích & Nạp Câu Hỏi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
