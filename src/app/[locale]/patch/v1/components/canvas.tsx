"use client";

import ThreeDCanvas from "@/components/layout/3D-canvas";
// import AudioPlayer from "@/components/layout/audio-player";
import StageSidebar from "@/components/quiz/StageSidebar";
import { AudioSessionContext } from "@/hooks/useAudio";
import { createTokyoSoundsSpec } from "@/lib/create-audio-spec";
import { createSharedAudioContext, createAudioSession } from "@/lib/audio";
import { useMemo, useState, useEffect } from "react";

export default function Canvas() {
  const spec = useMemo(() => createTokyoSoundsSpec(), []);
  const [sharedContext, setSharedContext] = useState<AudioContext | null>(null);
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sharedContext) {
      const initAudio = async () => {
        try {
          const audioContext = createSharedAudioContext({ sampleRate: 44100 });
          setSharedContext(audioContext);

          const audioSession = await createAudioSession(spec, { context: audioContext });
          setSession(audioSession);
          setReady(true);
        } catch (err) {
          console.error('[page] Failed to initialize audio:', err);
        }
      };

      initAudio();
    }
  }, [spec, sharedContext]);

  // wait for session to be ready
  if (!sharedContext || !session || !ready) {
    return (
      <main className="w-full min-h-screen flex flex-col md:flex-row justify-center items-center bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="w-full md:w-1/4 h-[90vh] p-2">
          <StageSidebar />
        </div>
        <div className="w-full md:w-3/4 flex flex-col md:flex-row gap-2 p-2">
          <div className="w-full h-[90vh] flex items-center justify-center">
            <p>セッション読み込み中</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AudioSessionContext.Provider value={session}>
      <main className="w-full min-h-screen flex flex-col md:flex-row justify-center items-center bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="w-full md:w-1/4 h-[90vh] p-2">
          <StageSidebar />
        </div>
        <div className="w-full md:w-3/4 flex flex-col md:flex-row gap-2 p-2">
          <div className="w-full h-[90vh]">
            <ThreeDCanvas sharedContext={sharedContext} />
          </div>
        </div>
      </main>
    </AudioSessionContext.Provider>
  );
}
