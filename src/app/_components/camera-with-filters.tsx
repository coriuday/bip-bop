import React, { useRef, useState } from 'react';

const filters = [
  { name: 'None', value: '' },
  { name: 'Grayscale', value: 'grayscale(1)' },
  { name: 'Sepia', value: 'sepia(1)' },
  { name: 'Invert', value: 'invert(1)' },
  { name: 'Blur', value: 'blur(3px)' },
  { name: 'Brightness', value: 'brightness(1.5)' },
];

const CameraWithFilters: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState(filters[0]?.value ?? "");
  const [streaming, setStreaming] = useState(false);

  const startCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ filter, width: 320, height: 240, borderRadius: 12 }}
        className="bg-black"
      />
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.name}
            className={`btn btn-xs ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.value)}
          >
            {f.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn btn-success btn-sm" onClick={startCamera} disabled={streaming}>Start Camera</button>
        <button className="btn btn-error btn-sm" onClick={stopCamera} disabled={!streaming}>Stop Camera</button>
      </div>
    </div>
  );
};

export default CameraWithFilters;
