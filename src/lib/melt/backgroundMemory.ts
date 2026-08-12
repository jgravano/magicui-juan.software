import {
  MELT_BACKGROUND_CONFIDENCE_MAX,
  MELT_BACKGROUND_REQUIRED_OBSERVATIONS,
} from "@/lib/melt/constants";

export type BackgroundMemory = {
  resize: (width: number, height: number) => void;
  reset: () => void;
  update: (frame: ImageData, personMask: ImageData) => number;
  snapshot: () => ImageData;
  getCoverage: () => number;
};

export const createBackgroundMemory = (): BackgroundMemory => {
  let width = 1;
  let height = 1;
  let colors = new Float32Array(4);
  let observations = new Uint16Array(1);
  let coverage = 0;
  let updateCount = 0;

  const allocate = (nextWidth: number, nextHeight: number) => {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    colors = new Float32Array(width * height * 4);
    observations = new Uint16Array(width * height);
    coverage = 0;
    updateCount = 0;
  };

  const calculateCoverage = () => {
    let covered = 0;
    for (let index = 0; index < observations.length; index += 1) {
      if (observations[index] >= MELT_BACKGROUND_REQUIRED_OBSERVATIONS) {
        covered += 1;
      }
    }
    coverage = covered / Math.max(1, observations.length);
  };

  const fillUnknownPixels = (data: Uint8ClampedArray, knownInput: Uint8Array) => {
    const known = new Uint8Array(knownInput);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    for (let index = 0; index < known.length; index += 1) {
      if (known[index] === 1) {
        queue[tail] = index;
        tail += 1;
      }
    }

    while (head < tail) {
      const source = queue[head];
      head += 1;
      const x = source % width;
      const y = Math.floor(source / width);
      const neighbors = [
        x > 0 ? source - 1 : -1,
        x < width - 1 ? source + 1 : -1,
        y > 0 ? source - width : -1,
        y < height - 1 ? source + width : -1,
      ];

      for (const target of neighbors) {
        if (target < 0 || known[target] === 1) {
          continue;
        }

        const sourceRgba = source * 4;
        const targetRgba = target * 4;
        data[targetRgba] = data[sourceRgba];
        data[targetRgba + 1] = data[sourceRgba + 1];
        data[targetRgba + 2] = data[sourceRgba + 2];
        data[targetRgba + 3] = 255;
        known[target] = 1;
        queue[tail] = target;
        tail += 1;
      }
    }
  };

  return {
    resize: (nextWidth, nextHeight) => {
      if (nextWidth !== width || nextHeight !== height) {
        allocate(nextWidth, nextHeight);
      }
    },
    reset: () => allocate(width, height),
    update: (frame, personMask) => {
      if (
        frame.width !== width ||
        frame.height !== height ||
        personMask.width !== width ||
        personMask.height !== height
      ) {
        return coverage;
      }

      const frameData = frame.data;
      const maskData = personMask.data;

      for (let index = 0; index < observations.length; index += 1) {
        const rgbaIndex = index * 4;
        const personConfidence = maskData[rgbaIndex + 3] / 255;
        if (personConfidence > MELT_BACKGROUND_CONFIDENCE_MAX) {
          continue;
        }

        const seen = observations[index];
        const alpha = seen < 8 ? 1 / (seen + 1) : 0.055;
        colors[rgbaIndex] += (frameData[rgbaIndex] - colors[rgbaIndex]) * alpha;
        colors[rgbaIndex + 1] += (frameData[rgbaIndex + 1] - colors[rgbaIndex + 1]) * alpha;
        colors[rgbaIndex + 2] += (frameData[rgbaIndex + 2] - colors[rgbaIndex + 2]) * alpha;
        colors[rgbaIndex + 3] = 255;
        observations[index] = Math.min(65535, seen + 1);
      }

      updateCount += 1;
      if (updateCount % 3 === 0) {
        calculateCoverage();
      }

      return coverage;
    },
    snapshot: () => {
      const result = new Uint8ClampedArray(width * height * 4);
      const known = new Uint8Array(width * height);

      for (let index = 0; index < observations.length; index += 1) {
        const rgbaIndex = index * 4;
        result[rgbaIndex] = Math.round(colors[rgbaIndex]);
        result[rgbaIndex + 1] = Math.round(colors[rgbaIndex + 1]);
        result[rgbaIndex + 2] = Math.round(colors[rgbaIndex + 2]);
        result[rgbaIndex + 3] = 255;
        known[index] = observations[index] >= MELT_BACKGROUND_REQUIRED_OBSERVATIONS ? 1 : 0;
      }

      fillUnknownPixels(result, known);
      return new ImageData(result, width, height);
    },
    getCoverage: () => coverage,
  };
};
