import { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCodeCanvas({ url, size = 280, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark: '#000', light: '#fff' },
      });
    }
  }, [url, size]);

  return <canvas ref={canvasRef} className={`rounded-lg ${className}`} />;
}
