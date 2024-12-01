import { useState } from 'react';

export const useAudioDuration = () => {
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  const getDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Impossible de lire le fichier audio"));
      });
      
      audio.src = objectUrl;
    });
  };

  const trimAudio = async (file: File, start: number, duration: number): Promise<Blob> => {
    const audioContext = new AudioContext();
    const audioBuffer = await file.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer));
    
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor((start + duration) * sampleRate);
    
    const trimmedBuffer = audioContext.createBuffer(
      channels,
      endSample - startSample,
      sampleRate
    );
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < trimmedBuffer.length; i++) {
        trimmedData[i] = channelData[i + startSample];
      }
    }
    
    return await audioBufferToBlob(trimmedBuffer);
  };

  const audioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const worker = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = worker.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(worker.destination);
    source.start();
    
    const renderedBuffer = await worker.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    
    return new Blob([wavBlob], { type: 'audio/wav' });
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // En-tête WAV
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return {
    duration,
    startTime,
    setStartTime,
    getDuration,
    trimAudio,
    setDuration
  };
};