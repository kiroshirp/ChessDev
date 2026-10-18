import { useEffect, useRef, useState } from 'react';
import type { Position } from '@pixelspace/world-engine';
import type { SceneControls } from './scene';
export function World({
  controls,
  label,
  loading,
  failed,
  onPosition,
  onEscape,
}: {
  controls: SceneControls;
  label: string;
  loading: string;
  failed: string;
  onPosition: (position: Position) => void;
  onEscape: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labelRef = useRef(label);
  labelRef.current = label;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    import('./scene')
      .then(({ createWorld }) => {
        if (cancelled || !host.current) return;
        game = createWorld(host.current, controls, labelRef.current, onPosition, onEscape);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [controls, onPosition, onEscape]);
  useEffect(() => {
    host.current?.querySelector('canvas')?.setAttribute('aria-label', label);
  }, [label, status]);
  return (
    <div className="world-host">
      <div className="engine-host" ref={host} />
      {status !== 'ready' && <p role="status">{status === 'error' ? failed : loading}</p>}
    </div>
  );
}
