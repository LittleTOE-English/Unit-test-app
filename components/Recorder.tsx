import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Activity } from 'lucide-react';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        
        // Stop tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
      };

      // Audio Visualization Setup
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      drawVisualizer();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("We need your microphone to hear your beautiful voice! Please allow access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        // GrapeSEED colors gradient
        ctx.fillStyle = `rgb(${barHeight + 100}, 85, 247)`; // Purple tint
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-full h-32 flex items-center justify-center bg-white rounded-3xl shadow-inner border-4 border-sky-100 overflow-hidden">
        {isRecording ? (
            <canvas ref={canvasRef} width={300} height={100} className="w-full h-full object-cover opacity-80" />
        ) : (
            <div className="text-gray-400 flex flex-col items-center">
                <Activity size={48} className="mb-2 opacity-50" />
                <p>Tap the mic to start!</p>
            </div>
        )}
      </div>

      {!isRecording ? (
        <button
          onClick={startRecording}
          className="w-24 h-24 bg-grape-500 hover:bg-grape-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110 focus:outline-none ring-4 ring-grape-200 animate-bounce-slow"
        >
          <Mic size={40} />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="w-24 h-24 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-105 focus:outline-none ring-4 ring-red-200 animate-pulse"
        >
          <Square size={32} fill="currentColor" />
        </button>
      )}
      
      <p className="text-lg font-bold text-gray-600">
        {isRecording ? "Listening..." : "Ready to record"}
      </p>
    </div>
  );
};

export default Recorder;
