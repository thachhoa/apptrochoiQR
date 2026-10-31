import React, { useState } from 'react';
import { Users, Shuffle } from 'lucide-react';
import { Student, AnswerOption, GamePhase, PlayMode, Language } from '../types';
import { StudentCard } from './StudentCard';
import { getTranslation } from '../utils/i18n';

interface StudentGridProps {
  students: Student[];
  phase: GamePhase;
  playMode: PlayMode;
  lang: Language;
  correctAnswer: AnswerOption;
  onSelectAnswer: (studentId: number, answer: AnswerOption) => void;
  onOpenCardModal: (student: Student) => void;
  onQuickBatchAnswers: () => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  phase,
  playMode,
  lang,
  correctAnswer,
  onSelectAnswer,
  onOpenCardModal,
  onQuickBatchAnswers,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'eliminated'>('all');

  const filteredStudents = students.filter(s => {
    if (filterMode === 'active') return s.status !== 'eliminated';
    if (filterMode === 'eliminated') return s.status === 'eliminated';
    return true;
  });

  const activeStudents = students.filter(s => s.status !== 'eliminated');
  const answeredCount = activeStudents.filter(s => s.currentAnswer !== null).length;

  return (
    <div className="w-full bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 border-2 border-purple-100 shadow-sm">
      {/* Arena floor header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
              Sàn Đấu Thí Sinh (Arena Floor)
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {answeredCount}/{activeStudents.length} {getTranslation(lang, 'answersCollected')}
            </p>
          </div>
        </div>

        {/* Filter and quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick simulation / batch fill for teacher convenience */}
          {phase === 'THINKING' && (
            <button
              onClick={onQuickBatchAnswers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition-colors shadow-2xs"
              title="Tự động điền đáp án mô phỏng cho tất cả học sinh đang thi đấu"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-600" />
              <span>Điền Ngẫu Nhiên</span>
            </button>
          )}

          {/* Filter tabs */}
          <div className="flex items-center bg-purple-50 p-1 rounded-xl border border-purple-100 text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'all' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({students.length})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Còn lại ({activeStudents.length})
            </button>
            <button
              onClick={() => setFilterMode('eliminated')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterMode === 'eliminated' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bị loại ({students.length - activeStudents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of students */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 max-h-[580px] overflow-y-auto pr-1">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            phase={phase}
            playMode={playMode}
            lang={lang}
            correctAnswer={correctAnswer}
            onSelectAnswer={onSelectAnswer}
            onOpenCardModal={onOpenCardModal}
          />
        ))}
      </div>
    </div>
  );
};
