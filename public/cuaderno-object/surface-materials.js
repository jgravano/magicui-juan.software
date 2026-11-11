import * as THREE from './vendor/three.module.min.js';

// Each tile has a physical size: a larger notebook gets more fibres, not larger
// fibres. Height and roughness maps stay linear; only the elastic colour is sRGB.
const PAPER_TILE = .7; // 35 mm, at the notebook's 50 mm per scene unit.
const ACETATE_TILE = 1.4;
const ELASTIC_TILE = .16; // 8 mm of woven tape.

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function canvas(size) {
  const image = document.createElement('canvas');
  image.width = image.height = size;
  return [image, image.getContext('2d')];
}

function field(size, random) {
  const values = Float32Array.from({length: size * size}, () => random() - .5);
  return (u, v) => {
    const x = u * size, y = v * size;
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (dx, dy) => values[((iy + dy) % size) * size + (ix + dx) % size];
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(at(0, 0), at(1, 0), sx),
      THREE.MathUtils.lerp(at(0, 1), at(1, 1), sx), sy,
    );
  };
}

function greyscale(context, size, sample) {
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, value = sample(x, y);
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function paperSurface() {
  const size = 512, [image, context] = canvas(size), random = seededRandom(1001);
  const formation = field(24, random), pulp = field(100, random);
  greyscale(context, size, (x, y) => 128
    + formation(x / size, y / size) * 10
    + pulp(x / size, y / size) * 14 + (random() - .5) * 13);
  context.lineCap = 'round';
  for (let i = 0; i < 4800; i++) {
    const x = random() * size, y = random() * size;
    const angle = random() * Math.PI * 2, length = 2 + random() * 7;
    const dx = Math.cos(angle) * length, dy = Math.sin(angle) * length;
    context.lineWidth = .45 + random() * .5;
    context.strokeStyle = random() < .5 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.045)';
    // Continue fibres across the tile boundary instead of exposing a square seam.
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      if (x + ox < -length || x + ox > size + length || y + oy < -length || y + oy > size + length) continue;
      context.beginPath();
      context.moveTo(x + ox, y + oy);
      context.quadraticCurveTo(x + ox + dx * .4 - dy * .12, y + oy + dy * .4 + dx * .12, x + ox + dx, y + oy + dy);
      context.stroke();
    }
  }
  const [colour, albedo] = canvas(size);
  const relief = context.getImageData(0, 0, size, size).data;
  // Paper formation is visible in diffuse light as well as in grazing relief.
  // Keep it near white: this is clean cellulose, not mottled or aged paper.
  greyscale(albedo, size, (x, y) => Math.min(255, 248 + (relief[(y * size + x) * 4] - 128) * .65));
  return {height: image, colour};
}

function acetateSurface() {
  const size = 512, [height, bump] = canvas(size), [roughness, rough] = canvas(size);
  const random = seededRandom(2001), finish = field(18, random);
  greyscale(bump, size, (x, y) => 128 + finish(x / size, y / size) * 3 + (random() - .5) * 2);
  greyscale(rough, size, (x, y) => 246 + finish(x / size, y / size) * 9 + (random() - .5) * 4);
  // A few shallow handling marks only break the highlight at close range. They
  // never enter the colour map, so a transparent cover remains visually clean.
  for (let i = 0; i < 14; i++) {
    const x = 40 + random() * (size - 80), y = 40 + random() * (size - 80);
    const angle = random() * Math.PI * 2, length = 4 + random() * 24;
    for (const [context, alpha] of [[bump, .022], [rough, .18]]) {
      context.strokeStyle = `rgba(255,255,255,${alpha})`;
      context.lineWidth = .4;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
  }
  return {height, roughness};
}

function elasticSurface() {
  const size = 256, [height, bump] = canvas(size), [colour, albedo] = canvas(size);
  const random = seededRandom(3001), yarn = field(32, random);
  // Longitudinal warp yarns and finer crosswise picks. The alternating crossing
  // changes the relief, rather than painting a large checkerboard onto the tape.
  const weave = (x, y) => {
    const warp = Math.pow(.5 + .5 * Math.cos(x * Math.PI / 8), 2);
    const weft = Math.pow(.5 + .5 * Math.cos(y * Math.PI / 4), 4);
    const crossing = Math.cos(x * Math.PI / 16) * Math.cos(y * Math.PI / 8);
    return warp * .68 + weft * (.18 + crossing * .08);
  };
  greyscale(bump, size, (x, y) => 96 + weave(x, y) * 82 + yarn(x / size, y / size) * 7 + (random() - .5) * 5);
  // The valleys between yarns need a diffuse cue; bump alone disappears on the
  // nearly front-lit released band. Parallel ribs remain legible when reduced.
  greyscale(albedo, size, (x, y) => 222 + weave(x, y) * 38 + yarn(x / size, y / size) * 5);
  return {height, colour};
}

export function createSurfaceDetails(renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const make = (image, name, colour = false) => {
    const texture = new THREE.CanvasTexture(image);
    texture.name = name;
    texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = anisotropy;
    return texture;
  };
  const acetate = acetateSurface(), elastic = elasticSurface(), paper = paperSurface();
  const paperBump = make(paper.height, 'Paper — cellulose relief');
  const acetateBump = make(acetate.height, 'Acetate — micro relief');
  const acetateRoughness = make(acetate.roughness, 'Acetate — surface finish');
  const elasticColor = make(elastic.colour, 'Elastic — undyed weave', true);
  const elasticBump = make(elastic.height, 'Elastic — warp and weft');
  // Extruded cover UVs are already in scene units, unlike paper and tape UVs.
  for (const texture of [acetateBump, acetateRoughness]) texture.repeat.setScalar(1 / ACETATE_TILE);

  const setDimensions = ({paperWidth, paperHeight, bandWidth, bandLength}) => {
    paperBump.repeat.set(paperWidth / PAPER_TILE, paperHeight / PAPER_TILE);
    for (const texture of [elasticColor, elasticBump]) texture.repeat.set(bandWidth / ELASTIC_TILE, bandLength / ELASTIC_TILE);
  };
  // Paint before dots, print and ink. Context coordinates remain 0..1024 even
  // for a 2K backing canvas. Tile proportions compensate for rectangular paper.
  const paintPaper = (context, width, height, strength = 1) => {
    if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && strength > 0)) return;
    const tileWidth = 1024 * PAPER_TILE / width, tileHeight = 1024 * PAPER_TILE / height;
    context.save();
    context.globalCompositeOperation = 'multiply';
    context.globalAlpha = Math.min(1, strength) * .9;
    for (let y = 0; y < 1024; y += tileHeight) for (let x = 0; x < 1024; x += tileWidth) {
      context.drawImage(paper.colour, x, y, tileWidth, tileHeight);
    }
    context.restore();
  };
  setDimensions({paperWidth: 2.85, paperHeight: 4.05, bandWidth: .16, bandLength: 4.35});
  return {
    paperBump, acetateBump, acetateRoughness, elasticColor, elasticBump, setDimensions, paintPaper,
    dispose() {
      for (const texture of [paperBump, acetateBump, acetateRoughness, elasticColor, elasticBump]) texture.dispose();
    },
  };
}
