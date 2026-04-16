"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DictionaryPaper } from "@/components/lupa/DictionaryPaper";
import { WebGLLens } from "@/components/lupa/WebGLLens";
import {
  LUPA_HINT_DURATION_MS,
  LUPA_LENS_RADIUS_MAX_PX,
  LUPA_LENS_RADIUS_MIN_PX,
  LUPA_LENS_RADIUS_RATIO,
  LUPA_LENS_ZOOM,
} from "@/lib/lupa/constants";
import type { DictionaryEntry } from "@/lib/lupa/dictionary-loader";
import { loadSpanishDictionary } from "@/lib/lupa/dictionary-loader";
import { createDictionaryLayout } from "@/lib/lupa/dictionary-layout";

export function LupaExperience() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [paperCanvas, setPaperCanvas] = useState<HTMLCanvasElement | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextEntries = await loadSpanishDictionary();
        if (!active) {
          return;
        }

        setEntries(nextEntries);
      } catch (error) {
        if (!active) {
          return;
        }

        setDictionaryError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el diccionario de Lupa.",
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowHint(false);
    }, LUPA_HINT_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const layout = useMemo(() => createDictionaryLayout(entries), [entries]);

  const handlePaperCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    setPaperCanvas((previous) => (previous === canvas ? previous : canvas));
  }, []);

  return (
    <div className="lupa-experience" aria-label="Lupa interactive experiment">
      <DictionaryPaper layout={layout} onCanvasReady={handlePaperCanvasReady} />
      <WebGLLens
        sourceCanvas={paperCanvas}
        radiusRatio={LUPA_LENS_RADIUS_RATIO}
        minRadiusPx={LUPA_LENS_RADIUS_MIN_PX}
        maxRadiusPx={LUPA_LENS_RADIUS_MAX_PX}
        zoom={LUPA_LENS_ZOOM}
      />
      {showHint ? <p className="lupa-hint">mueve el mouse para enfocar</p> : null}
      {dictionaryError ? <p className="lupa-status">{dictionaryError}</p> : null}
    </div>
  );
}
