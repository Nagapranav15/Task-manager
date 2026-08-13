import React, { useState, useRef, useEffect } from "react";
import { LuMic, LuSquare, LuTrash2, LuSend, LuPlay, LuPause } from "react-icons/lu";

export default function VoiceRecorder({ onSendVoiceNote, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [peaks, setPeaks] = useState([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start(100);
            setIsRecording(true);
            setRecordingTime(0);

            // Generate synthetic peaks array for waveform visualization
            const peakInterval = setInterval(() => {
                setPeaks((prev) => [...prev.slice(-30), Math.floor(Math.random() * 80) + 20]);
            }, 150);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            return () => clearInterval(peakInterval);
        } catch (err) {
            console.error("Failed to start voice recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onSendVoiceNote({
                blob: audioBlob,
                durationMs: recordingTime * 1000,
                waveform: peaks
            });
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.playbackRate = playbackSpeed;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleSpeed = () => {
        const next = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
        setPlaybackSpeed(next);
        if (audioRef.current) {
            audioRef.current.playbackRate = next;
        }
    };

    useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="flex items-center gap-3 w-full bg-[#0e1726] border border-slate-800 p-2.5 rounded-2xl animate-in fade-in duration-200">
            {isRecording ? (
                <>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-mono font-bold text-rose-400">{formatTime(recordingTime)}</span>
                    </div>

                    {/* Waveform Visualization */}
                    <div className="flex-1 flex items-center gap-1 h-6 overflow-hidden px-2">
                        {peaks.map((p, idx) => (
                            <div
                                key={idx}
                                style={{ height: `${p}%` }}
                                className="w-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full transition-all duration-100"
                            />
                        ))}
                    </div>

                    <button
                        onClick={stopRecording}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                    >
                        <LuSquare className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Stop</span>
                    </button>
                </>
            ) : audioUrl ? (
                <>
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                    />
                    <button
                        onClick={togglePlayback}
                        className="p-2 rounded-xl bg-emerald-500 text-[#0f172a] shadow-lg"
                    >
                        {isPlaying ? <LuPause className="w-4 h-4" /> : <LuPlay className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                        onClick={toggleSpeed}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-black text-emerald-400 border border-emerald-500/30"
                    >
                        {playbackSpeed}x
                    </button>

                    <div className="flex-1 text-xs font-mono text-slate-300 font-medium">
                        Voice Note ({formatTime(recordingTime)})
                    </div>

                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                        <LuTrash2 className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleSend}
                        className="p-2.5 rounded-xl bg-emerald-500 text-[#0f172a] font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                    >
                        <LuSend className="w-4 h-4" />
                    </button>
                </>
            ) : null}
        </div>
    );
}
