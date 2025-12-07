'use client';

// audio player and quiz interface
import { useQuizStore } from '@/stores/quiz-store';
import QuizGame from '../quiz/QuizGame';
import { useAudioControl } from "../audio/audio-control-context";
import { Play, Pause, Square, Music, Volume2 } from 'lucide-react';

export default function AudioPlayer() {
  const { playAudio, pauseAudio, resumeAudio, stopAudio, isPlaying, currentAudioUrl } = useAudioControl();
  const { gameStarted } = useQuizStore();

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden">
      {/* Audio Controls Section */}
      <div className="p-3 bg-slate-700/30 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center text-slate-200">
            <Music size={18} className="mr-2 text-blue-400" />
            <span className="text-sm">Audio Player</span>
          </h3>
          {gameStarted && (
            <span className="text-xs px-2 py-1 bg-blue-900/60 text-blue-300 rounded-full font-medium border border-blue-800/50">
              Quiz Active
            </span>
          )}
        </div>
        
        {currentAudioUrl && (
          <div className="text-xs text-slate-400 flex items-center bg-slate-800/50 p-2 rounded border border-slate-700/50 truncate">
            <Volume2 size={12} className="mr-1.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">
              <span className="font-medium text-slate-300">{isPlaying ? "Now Playing:" : "Paused:"}</span>
              <span className="ml-1 text-slate-200">{currentAudioUrl.split('/').pop()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Compact Controls */}
      <div className="flex items-center justify-center py-2 space-x-3">
        <button
          title="Play Audio"
          onClick={() => {
            if (currentAudioUrl && !isPlaying) {
              resumeAudio();
            } else if (!currentAudioUrl) {
              playAudio("/audio/tokyo-street.mp3");
            }
          }}
          className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-full transition-all duration-200 text-white disabled:bg-slate-700 disabled:cursor-not-allowed border border-blue-500/30"
          disabled={isPlaying}
        >
          <Play size={18} />
        </button>
        <button
          title="Pause Audio"
          onClick={pauseAudio}
          className="p-2 bg-yellow-600/80 hover:bg-yellow-600 rounded-full transition-all duration-200 text-white disabled:bg-slate-700 disabled:cursor-not-allowed border border-yellow-500/30"
          disabled={!isPlaying}
        >
          <Pause size={18} />
        </button>
        <button
          title="Stop Audio"
          onClick={stopAudio}
          className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full transition-all duration-200 text-white disabled:bg-slate-700 disabled:cursor-not-allowed border border-red-500/30"
          disabled={!currentAudioUrl}
        >
          <Square size={16} className="ml-0.5" />
        </button>
      </div>

      {/* Quiz Game Section */}
      <div className="flex-1 min-h-0 border-t border-slate-700/50">
        <QuizGame />
      </div>
    </div>
  );
}
