import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/theme-context";

export function ParticleWaveBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let animationId = 0;
    let lastTime = 0;
    let elapsed = 0;

    const columns = 75;
    const rows = 36;

    function resize() {
      if (!canvas || !context) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      if (!context || width === 0 || height === 0) return;

      context.clearRect(0, 0, width, height);

      for (let row = 0; row < rows; row++) {
        const depth = row / (rows - 1);
        const perspective = 0.48 + depth * 0.85;

        for (let col = 0; col < columns; col++) {
          const horizontal = col / (columns - 1);
          const x = horizontal * 2 - 1;

          // Ondas suaves em duas direções.
          const waveA = Math.sin(x * 5.5 - time * 0.45 + depth * 5);

          const waveB = Math.cos(x * 3.2 + time * 0.3 - depth * 8);

          const wave = waveA * 0.7 + waveB * 0.3;

          // Projeção em perspectiva.
          const screenX = width / 2 + x * width * 0.8 * perspective;

          const screenY =
            height * (0.65 + depth * 0.36) +
            wave * height * 0.065 * perspective;

          const radius = 0.45 + depth * 1.65;

          const opacity =
            (0.12 + depth * 0.52) *
            (0.75 + Math.sin(x * 3 + time * 0.25) * 0.15);

          // Cores adaptadas ao tema.
          const color =
            theme === "dark"
              ? `rgba(200, 230, 255, ${Math.min(opacity * 1.8, 0.95)})`
              : `rgba(37, 99, 235, ${Math.min(opacity * 1.4, 0.85)})`;

          context.beginPath();
          context.arc(screenX, screenY, radius, 0, Math.PI * 2);

          context.fillStyle = color;
          context.fill();
        }
      }
    }

    function animate(timestamp: number) {
      if (!lastTime) lastTime = timestamp;

      const delta = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;

      elapsed += delta / 1000;
      draw(elapsed);

      animationId = requestAnimationFrame(animate);
    }

    function start() {
      cancelAnimationFrame(animationId);
      lastTime = 0;

      if (document.hidden || motionQuery.matches) {
        draw(elapsed);
        return;
      }

      animationId = requestAnimationFrame(animate);
    }

    function handleVisibilityChange() {
      start();
    }

    const observer = new ResizeObserver(() => {
      resize();
      draw(elapsed);
    });

    observer.observe(canvas);

    resize();
    start();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    motionQuery.addEventListener("change", start);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      motionQuery.removeEventListener("change", start);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
