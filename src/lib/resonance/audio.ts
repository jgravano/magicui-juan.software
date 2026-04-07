import type * as ToneType from "tone";

import {
  AUDIO_AIR_FILTER_HZ,
  AUDIO_AIR_GAIN,
  AUDIO_BASE_FILTER_MAX_HZ,
  AUDIO_BASE_FILTER_MIN_HZ,
  AUDIO_CLICK_DURATION_MAX_SECONDS,
  AUDIO_CLICK_DURATION_MIN_SECONDS,
  AUDIO_CLICK_FILTER_BASE_HZ,
  AUDIO_CLICK_FILTER_SWEEP_HZ,
  AUDIO_CLICK_FREQUENCY_MAX_HZ,
  AUDIO_CLICK_FREQUENCY_MIN_HZ,
  AUDIO_CLICK_GAIN,
  AUDIO_CLICK_SPEED_REFERENCE,
  AUDIO_CLICK_VELOCITY_BASE,
  AUDIO_CLICK_VELOCITY_BOOST,
  AUDIO_DRONE_BREATH_FREQUENCY,
  AUDIO_DRONE_GAIN,
  AUDIO_FILTER_LFO_FREQUENCY,
  AUDIO_HIGH_FREQUENCY_HZ,
  AUDIO_LOW_FREQUENCY_HZ,
  AUDIO_MASTER_GAIN,
  AUDIO_MOD_AIR_FILTER_SWEEP_HZ,
  AUDIO_MOD_AIR_GAIN_BOOST,
  AUDIO_MOD_DETUNE_CENTS,
  AUDIO_MOD_DRONE_GAIN_BOOST,
  AUDIO_MOD_FILTER_BOOST_HZ,
  AUDIO_MOD_RESPONSE,
  AUDIO_MOD_REVERB_WET_BOOST,
  AUDIO_MOD_SPEED_REFERENCE,
  AUDIO_REVERB_DECAY_SECONDS,
  AUDIO_REVERB_WET,
} from "./constants";
import type { CanvasDimensions, InputState, PointerClick } from "./types";
import { clamp, lerp } from "./utils";

type ToneModule = typeof ToneType;

type ResonanceAudioGraph = {
  masterGain: ToneType.Gain;
  droneGain: ToneType.Gain;
  airGain: ToneType.Gain;
  lowOscillator: ToneType.Oscillator;
  highOscillator: ToneType.Oscillator;
  airNoise: ToneType.Noise;
  droneFilter: ToneType.Filter;
  airFilter: ToneType.Filter;
  reverb: ToneType.Reverb;
  clickFilter: ToneType.Filter;
  clickGain: ToneType.Gain;
  clickSynth: ToneType.Synth;
  filterLfo: ToneType.LFO;
  breathLfo: ToneType.LFO;
};

export type ResonanceAudioState = {
  graph: ResonanceAudioGraph | null;
  isStarting: boolean;
  hasStarted: boolean;
  modulation: {
    speed: number;
    x: number;
    y: number;
  };
};

export const createResonanceAudioState = (): ResonanceAudioState => ({
  graph: null,
  isStarting: false,
  hasStarted: false,
  modulation: {
    speed: 0,
    x: 0.5,
    y: 0.5,
  },
});

const createResonanceAudioGraph = async (Tone: ToneModule): Promise<ResonanceAudioGraph> => {
  const masterGain = new Tone.Gain(AUDIO_MASTER_GAIN).toDestination();
  const reverb = new Tone.Reverb({
    decay: AUDIO_REVERB_DECAY_SECONDS,
    wet: AUDIO_REVERB_WET,
  });
  await reverb.generate();
  reverb.connect(masterGain);

  const droneFilter = new Tone.Filter({
    type: "lowpass",
    frequency: AUDIO_BASE_FILTER_MIN_HZ,
    rolloff: -24,
    Q: 0.6,
  });
  droneFilter.connect(reverb);

  const droneGain = new Tone.Gain(AUDIO_DRONE_GAIN);
  droneGain.connect(droneFilter);

  const lowOscillator = new Tone.Oscillator(AUDIO_LOW_FREQUENCY_HZ, "sine").start();
  const highOscillator = new Tone.Oscillator(AUDIO_HIGH_FREQUENCY_HZ, "triangle").start();
  lowOscillator.connect(droneGain);
  highOscillator.connect(droneGain);

  const airFilter = new Tone.Filter({
    type: "highpass",
    frequency: AUDIO_AIR_FILTER_HZ,
    rolloff: -24,
    Q: 0.35,
  });
  const airGain = new Tone.Gain(AUDIO_AIR_GAIN);
  const airNoise = new Tone.Noise("pink").start();
  airNoise.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(reverb);

  const clickFilter = new Tone.Filter({
    type: "bandpass",
    frequency: AUDIO_CLICK_FILTER_BASE_HZ,
    rolloff: -24,
    Q: 1.8,
  });
  const clickGain = new Tone.Gain(AUDIO_CLICK_GAIN);
  const clickSynth = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.001,
      decay: 0.08,
      sustain: 0,
      release: 0.12,
    },
  });
  clickSynth.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(reverb);

  const filterLfo = new Tone.LFO({
    frequency: AUDIO_FILTER_LFO_FREQUENCY,
    min: AUDIO_BASE_FILTER_MIN_HZ,
    max: AUDIO_BASE_FILTER_MAX_HZ,
  }).start();
  filterLfo.connect(droneFilter.frequency);

  const breathLfo = new Tone.LFO({
    frequency: AUDIO_DRONE_BREATH_FREQUENCY,
    min: AUDIO_DRONE_GAIN * 0.72,
    max: AUDIO_DRONE_GAIN * 1.12,
  }).start();
  breathLfo.connect(droneGain.gain);

  return {
    masterGain,
    droneGain,
    airGain,
    lowOscillator,
    highOscillator,
    airNoise,
    droneFilter,
    airFilter,
    reverb,
    clickFilter,
    clickGain,
    clickSynth,
    filterLfo,
    breathLfo,
  };
};

export const startResonanceAudio = async (audioState: ResonanceAudioState) => {
  if (audioState.hasStarted || audioState.isStarting) {
    return;
  }

  audioState.isStarting = true;

  try {
    const Tone = await import("tone");
    await Tone.start();
    audioState.graph = await createResonanceAudioGraph(Tone);
    audioState.hasStarted = true;
  } catch {
    audioState.graph = null;
    audioState.hasStarted = false;
  } finally {
    audioState.isStarting = false;
  }
};

export const disposeResonanceAudio = (audioState: ResonanceAudioState) => {
  const graph = audioState.graph;

  if (!graph) {
    return;
  }

  graph.lowOscillator.stop();
  graph.highOscillator.stop();
  graph.airNoise.stop();
  graph.filterLfo.stop();
  graph.breathLfo.stop();

  graph.lowOscillator.dispose();
  graph.highOscillator.dispose();
  graph.airNoise.dispose();
  graph.droneGain.dispose();
  graph.airGain.dispose();
  graph.droneFilter.dispose();
  graph.airFilter.dispose();
  graph.clickFilter.dispose();
  graph.clickGain.dispose();
  graph.clickSynth.dispose();
  graph.filterLfo.dispose();
  graph.breathLfo.dispose();
  graph.reverb.dispose();
  graph.masterGain.dispose();

  audioState.graph = null;
  audioState.hasStarted = false;
  audioState.isStarting = false;
};

type UpdateResonanceAudioPayload = {
  inputState: InputState;
  dimensions: CanvasDimensions;
  deltaSeconds: number;
};

const triggerClickTone = (
  graph: ResonanceAudioGraph,
  click: PointerClick,
  dimensions: CanvasDimensions,
) => {
  const normalizedX = clamp(click.position.x / Math.max(1, dimensions.width), 0, 1);
  const normalizedY = clamp(click.position.y / Math.max(1, dimensions.height), 0, 1);
  const clickSpeed = Math.hypot(click.velocity.x, click.velocity.y);
  const speedRatio = clamp(clickSpeed / AUDIO_CLICK_SPEED_REFERENCE, 0, 1);

  const frequency = lerp(AUDIO_CLICK_FREQUENCY_MIN_HZ, AUDIO_CLICK_FREQUENCY_MAX_HZ, normalizedX);
  const duration = lerp(
    AUDIO_CLICK_DURATION_MAX_SECONDS,
    AUDIO_CLICK_DURATION_MIN_SECONDS,
    speedRatio,
  );
  const velocity = AUDIO_CLICK_VELOCITY_BASE + speedRatio * AUDIO_CLICK_VELOCITY_BOOST;

  graph.clickFilter.frequency.value =
    AUDIO_CLICK_FILTER_BASE_HZ + (1 - normalizedY) * AUDIO_CLICK_FILTER_SWEEP_HZ;
  graph.clickSynth.triggerAttackRelease(frequency, duration, undefined, velocity);
};

export const updateResonanceAudio = (
  audioState: ResonanceAudioState,
  payload: UpdateResonanceAudioPayload,
) => {
  const graph = audioState.graph;

  if (!graph || !audioState.hasStarted) {
    return;
  }

  const { inputState, dimensions, deltaSeconds } = payload;
  const targetSpeed = inputState.isPointerInside
    ? clamp(inputState.speed / AUDIO_MOD_SPEED_REFERENCE, 0, 1)
    : 0;
  const targetX = clamp(inputState.pointer.x / Math.max(1, dimensions.width), 0, 1);
  const targetY = clamp(inputState.pointer.y / Math.max(1, dimensions.height), 0, 1);

  const blend = 1 - Math.exp(-AUDIO_MOD_RESPONSE * deltaSeconds);
  audioState.modulation.speed = lerp(audioState.modulation.speed, targetSpeed, blend);
  audioState.modulation.x = lerp(audioState.modulation.x, targetX, blend);
  audioState.modulation.y = lerp(audioState.modulation.y, targetY, blend);

  const speedCurve = Math.pow(audioState.modulation.speed, 0.8);
  // Horizontal movement colors timbre; vertical movement opens airy high content.
  const centerBiasedX = Math.pow(audioState.modulation.x, 0.85);
  const altitude = 1 - audioState.modulation.y;

  const baseFilterCenter = lerp(
    AUDIO_BASE_FILTER_MIN_HZ,
    AUDIO_BASE_FILTER_MAX_HZ,
    centerBiasedX,
  );
  const filterCenter = baseFilterCenter + speedCurve * AUDIO_MOD_FILTER_BOOST_HZ;
  const filterMin = clamp(filterCenter * 0.72, 80, 6000);
  const filterMax = clamp(filterCenter * 1.18, filterMin + 20, 8000);

  graph.filterLfo.min = filterMin;
  graph.filterLfo.max = filterMax;

  const droneGainBase = AUDIO_DRONE_GAIN * (1 + speedCurve * AUDIO_MOD_DRONE_GAIN_BOOST);
  graph.breathLfo.min = droneGainBase * 0.72;
  graph.breathLfo.max = droneGainBase * 1.12;

  graph.airGain.gain.value = AUDIO_AIR_GAIN * (1 + speedCurve * AUDIO_MOD_AIR_GAIN_BOOST);
  graph.airFilter.frequency.value =
    AUDIO_AIR_FILTER_HZ + altitude * AUDIO_MOD_AIR_FILTER_SWEEP_HZ;

  graph.highOscillator.detune.value =
    (audioState.modulation.x - 0.5) * AUDIO_MOD_DETUNE_CENTS +
    speedCurve * (AUDIO_MOD_DETUNE_CENTS * 0.45);
  graph.reverb.wet.value = clamp(
    AUDIO_REVERB_WET + speedCurve * AUDIO_MOD_REVERB_WET_BOOST + altitude * 0.04,
    0,
    1,
  );

  if (inputState.frameClicks.length > 0) {
    for (const click of inputState.frameClicks) {
      if (!click.isInside) {
        continue;
      }

      triggerClickTone(graph, click, dimensions);
    }
  }
};
