import React, { useState, useEffect } from 'react';
import { HeartHandshake, AlertTriangle } from 'lucide-react';
import { 
  Student, 
  Question, 
  GamePhase, 
  PlayMode, 
  Language, 
  AnswerOption,
  GameStateSnapshot 
} from './types';
import { Header } from './components/Header';
import { QuestionBoard } from './components/QuestionBoard';
import { StudentGrid } from './components/StudentGrid';
import { ControlBar } from './components/ControlBar';
import { CameraScannerModal } from './components/CameraScannerModal';
import { StudentCardModal } from './components/StudentCardModal';
import { PrintCardsModal } from './components/PrintCardsModal';
import { QuestionManagerModal } from './components/QuestionManagerModal';
import { TeacherRevivalModal } from './components/TeacherRevivalModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ClassSizeModal } from './components/ClassSizeModal';
import { VictoryModal } from './components/VictoryModal';
import { ApiKeyModal, GeminiModel } from './components/ApiKeyModal';
import { StudentRosterModal } from './components/StudentRosterModal';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { SAMPLE_QUESTIONS } from './data/sampleQuestions';
import { generateDefaultStudents } from './utils/avatars';
import { soundFX } from './utils/soundEffects';
import { getTranslation } from './utils/i18n';

// ─── localStorage helpers ───────────────────────────────────────────────────
const LS_KEY_API  = 'golden_bell_api_key';
const LS_KEY_MODEL = 'golden_bell_model';

// Default model: gemini-3-flash-preview theo AI_INSTRUCTIONS.md
const DEFAULT_MODEL: GeminiModel = 'gemini-3-flash-preview';

function loadApiKey(): string {
  try { return localStorage.getItem(LS_KEY_API) ?? ''; } catch { return ''; }
}
function loadModel(): GeminiModel {
  try {
    const v = localStorage.getItem(LS_KEY_MODEL) as GeminiModel | null;
    return v ?? DEFAULT_MODEL;
  } catch { return DEFAULT_MODEL; }
}
function saveApiSettings(key: string, model: GeminiModel) {
  try {
    localStorage.setItem(LS_KEY_API, key);
    localStorage.setItem(LS_KEY_MODEL, model);
  } catch { /* ignore */ }
}

export default function App() {
  // Core Settings
  const [lang, setLang] = useState<Language>('vi');
  const [playMode, setPlayMode] = useState<PlayMode>('UI');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // AI Settings
  const [apiKey, setApiKey] = useState<string>(loadApiKey);
  const [aiModel, setAiModel] = useState<GeminiModel>(loadModel);

  // Game Data
  const [students, setStudents] = useState<Student[]>(() => generateDefaultStudents(30));
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [timeRemaining, setTimeRemaining] = useState<number>(15);

  // History stack for Undo
  const [history, setHistory] = useState<GameStateSnapshot[]>([]);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isClassSizeOpen, setIsClassSizeOpen] = useState<boolean>(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState<boolean>(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState<boolean>(false);
  const [isRevivalOpen, setIsRevivalOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const [isRosterOpen, setIsRosterOpen] = useState<boolean>(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Save state snapshot for Undo
  const pushHistorySnapshot = () => {
    setHistory(prev => [
      ...prev,
      {
        phase,
        currentQuestionIndex,
        students: JSON.parse(JSON.stringify(students)),
        timeRemaining,
      }
    ].slice(-10)); // Keep up to 10 undo steps
  };

  // Undo Action
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setPhase(previous.phase);
    setCurrentQuestionIndex(previous.currentQuestionIndex);
    setStudents(previous.students);
    setTimeRemaining(previous.timeRemaining);
    soundFX.playClick();
  };

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (phase === 'THINKING' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time is up!
            soundFX.playTimesUp();
            setPhase('LOCKED');
            return 0;
          }
          if (prev <= 4) {
            soundFX.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, timeRemaining]);

  // Answer statistics
  const activeStudents = students.filter(s => s.status !== 'eliminated');
  const eliminatedStudents = students.filter(s => s.status === 'eliminated');
  const stats = {
    A: activeStudents.filter(s => s.currentAnswer === 'A').length,
    B: activeStudents.filter(s => s.currentAnswer === 'B').length,
    C: activeStudents.filter(s => s.currentAnswer === 'C').length,
    D: activeStudents.filter(s => s.currentAnswer === 'D').length,
    total: activeStudents.filter(s => s.currentAnswer !== null).length,
  };

  // Start current question countdown
  const handleStart = () => {
    pushHistorySnapshot();
    soundFX.playBellRing();
    setTimeRemaining(currentQuestion.timeLimit || 15);
    setPhase('THINKING');
    // Clear previous round answers for active students
    setStudents(prev => prev.map(s => (
      s.status === 'eliminated' 
        ? s 
        : { ...s, currentAnswer: null, lastAnswerCorrect: null }
    )));
  };

  // Lock / Submit answers
  const handleSubmit = () => {
    pushHistorySnapshot();
    soundFX.playTimesUp();
    setPhase('LOCKED');
  };

  // Reveal correct answer and evaluate survivors
  const handleReveal = () => {
    pushHistorySnapshot();
    const correct = currentQuestion.correctAnswer;
    let anySurvivor = false;

    const updated = students.map(s => {
      if (s.status === 'eliminated') return s;
      const isRight = s.currentAnswer === correct;
      if (isRight) {
        anySurvivor = true;
        return {
          ...s,
          status: 'active' as const,
          score: s.score + 10,
          streak: s.streak + 1,
          lastAnswerCorrect: true,
        };
      } else {
        return {
          ...s,
          status: 'eliminated' as const,
          streak: 0,
          lastAnswerCorrect: false,
        };
      }
    });

    setStudents(updated);
    setPhase('REVEAL');

    if (anySurvivor) {
      soundFX.playCorrect();
      // Check if this was the last question or 1 survivor remains
      const remaining = updated.filter(s => s.status !== 'eliminated');
      if (currentQuestionIndex === questions.length - 1 || remaining.length === 1) {
        setTimeout(() => {
          setIsVictoryOpen(true);
        }, 1200);
      }
    } else {
      soundFX.playEliminated();
    }
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      pushHistorySnapshot();
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('LOBBY');
      setTimeRemaining(questions[currentQuestionIndex + 1]?.timeLimit || 15);
      // Clean student answers for lobby
      setStudents(prev => prev.map(s => ({
        ...s,
        currentAnswer: null,
        lastAnswerCorrect: null,
      })));
      soundFX.playClick();
    } else {
      setIsVictoryOpen(true);
    }
  };

  // New Game reset
  const handleNewGame = () => {
    if (window.confirm(getTranslation(lang, 'confirmNewGame'))) {
      pushHistorySnapshot();
      setPhase('LOBBY');
      setCurrentQuestionIndex(0);
      setTimeRemaining(questions[0]?.timeLimit || 15);
      setStudents(prev => prev.map(s => ({
        ...s,
        status: 'active',
        currentAnswer: null,
        score: 0,
        streak: 0,
        lastAnswerCorrect: null,
      })));
      soundFX.playBellRing();
    }
  };

  // Selecting answer for a student (touch or QR scan)
  const handleSelectAnswer = (studentId: number, answer: AnswerOption) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId && s.status !== 'eliminated') {
        return { ...s, currentAnswer: answer };
      }
      return s;
    }));
    soundFX.playClick();
  };

  // Quick batch answers generator for testing/demoing
  const handleQuickBatchAnswers = () => {
    const letters: AnswerOption[] = ['A', 'B', 'C', 'D'];
    setStudents(prev => prev.map(s => {
      if (s.status !== 'eliminated') {
        // Bias slightly towards the correct answer for realistic gameplay
        const isSmart = Math.random() < 0.65;
        const chosen = isSmart 
          ? currentQuestion.correctAnswer 
          : letters[Math.floor(Math.random() * letters.length)];
        return { ...s, currentAnswer: chosen };
      }
      return s;
    }));
    soundFX.playClick();
  };

  // Teacher Revival minigame execution
  const handleReviveStudents = (count: number) => {
    pushHistorySnapshot();
    const eliminated = students.filter(s => s.status === 'eliminated');
    // Take first `count` eliminated students
    const toReviveIds = new Set(eliminated.slice(0, count).map(s => s.id));

    setStudents(prev => prev.map(s => {
      if (toReviveIds.has(s.id)) {
        return {
          ...s,
          status: 'revived',
          currentAnswer: null,
          lastAnswerCorrect: null,
        };
      }
      return s;
    }));
  };

  // Class size change (10 to 100 students)
  const handleSelectClassSize = (count: number) => {
    pushHistorySnapshot();
    setStudents(generateDefaultStudents(count));
    setPhase('LOBBY');
    setCurrentQuestionIndex(0);
  };

  // Update student names from roster
  const handleUpdateStudentNames = (names: string[]) => {
    setStudents(prev =>
      prev.map((s, i) => ({
        ...s,
        name: names[i] ?? s.name,
      }))
    );
  };

  // Save API key + model
  const handleSaveApiKey = (key: string, model: GeminiModel) => {
    setApiKey(key);
    setAiModel(model);
    saveApiSettings(key, model);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
  };

  const handleToggleLang = () => {
    setLang(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const handleTogglePlayMode = () => {
    const nextMode = playMode === 'UI' ? 'SCANNER' : 'UI';
    setPlayMode(nextMode);
    if (nextMode === 'SCANNER') {
      setIsScannerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5FF] text-slate-800 flex flex-col selection:bg-purple-200">
      {/* Top Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        playMode={playMode}
        onTogglePlayMode={handleTogglePlayMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        activeCount={activeStudents.length}
        eliminatedCount={eliminatedStudents.length}
        totalCount={students.length}
        currentRound={currentQuestionIndex}
        totalRounds={questions.length}
        onOpenClassSize={() => setIsClassSizeOpen(true)}
        onOpenCards={() => setIsPrintCardsOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenRoster={() => setIsRosterOpen(true)}
        hasApiKey={apiKey.length > 0}
      />

      {/* Main Arena Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-5">
        {/* All Eliminated Warning Banner */}
        {activeStudents.length === 0 && (
          <div className="p-4 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-950 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base">
                  Tất cả thí sinh đã bị loại! (No Active Survivors)
                </h4>
                <p className="text-xs font-semibold text-rose-800">
                  {getTranslation(lang, 'noSurvivors')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRevivalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>Kích Hoạt Cứu Trợ Thầy Cô Ngay!</span>
            </button>
          </div>
        )}

        {/* Central Question Display Board */}
        <QuestionBoard
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          phase={phase}
          timeRemaining={timeRemaining}
          lang={lang}
          stats={stats}
        />

        {/* Two-column layout: Student Grid + Leaderboard */}
        <div className="flex flex-col xl:flex-row gap-5">
          {/* Student Arena Floor Grid */}
          <div className="flex-1 min-w-0">
            <StudentGrid
              students={students}
              phase={phase}
              playMode={playMode}
              lang={lang}
              correctAnswer={currentQuestion.correctAnswer}
              onSelectAnswer={handleSelectAnswer}
              onOpenCardModal={(student) => setSelectedStudentForCard(student)}
              onQuickBatchAnswers={handleQuickBatchAnswers}
            />
          </div>

          {/* Leaderboard Panel — side column on XL, below on smaller */}
          <div className="xl:w-72 shrink-0">
            <LeaderboardPanel students={students} lang={lang} />
          </div>
        </div>
      </main>

      {/* Bottom Control Bar */}
      <ControlBar
        phase={phase}
        lang={lang}
        canUndo={history.length > 0}
        onStart={handleStart}
        onSubmit={handleSubmit}
        onReveal={handleReveal}
        onNextQuestion={handleNextQuestion}
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenRevival={() => setIsRevivalOpen(true)}
        onOpenQuestions={() => setIsQuestionsOpen(true)}
        activeCount={activeStudents.length}
      />

      {/* Modals */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        lang={lang}
        onStudentScanned={handleSelectAnswer}
      />

      <StudentCardModal
        student={selectedStudentForCard}
        isOpen={selectedStudentForCard !== null}
        onClose={() => setSelectedStudentForCard(null)}
        lang={lang}
        onApplyAnswer={handleSelectAnswer}
      />

      <PrintCardsModal
        isOpen={isPrintCardsOpen}
        onClose={() => setIsPrintCardsOpen(false)}
        students={students}
        lang={lang}
      />

      <QuestionManagerModal
        isOpen={isQuestionsOpen}
        onClose={() => setIsQuestionsOpen(false)}
        questions={questions}
        onUpdateQuestions={(newQuestions) => {
          setQuestions(newQuestions);
          setCurrentQuestionIndex(0);
          setPhase('LOBBY');
        }}
        lang={lang}
      />

      <TeacherRevivalModal
        isOpen={isRevivalOpen}
        onClose={() => setIsRevivalOpen(false)}
        students={students}
        lang={lang}
        onReviveStudents={handleReviveStudents}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        lang={lang}
      />

      <ClassSizeModal
        isOpen={isClassSizeOpen}
        onClose={() => setIsClassSizeOpen(false)}
        currentCount={students.length}
        onSelectSize={handleSelectClassSize}
        lang={lang}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        winners={activeStudents.length > 0 ? activeStudents : students.slice(0, 1)}
        lang={lang}
        onNewGame={() => {
          setIsVictoryOpen(false);
          handleNewGame();
        }}
      />

      {/* API Key Modal — bắt buộc khi chưa có key (AI_INSTRUCTIONS.md §2) */}
      <ApiKeyModal
        isOpen={isApiKeyOpen || apiKey.length === 0}
        onClose={() => setIsApiKeyOpen(false)}
        currentKey={apiKey}
        currentModel={aiModel}
        onSave={handleSaveApiKey}
        isRequired={apiKey.length === 0}
      />

      {/* NEW: Student Roster Modal */}
      <StudentRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        currentNames={students.map((s) => s.name)}
        lang={lang}
        onUpdateNames={handleUpdateStudentNames}
      />
    </div>
  );
}
