import * as THREE from './vendor/three.module.min.js';

// A small four-sample softbox retains contact shadows around the wire while its
// separated samples soften shadows cast farther from the page. Total map area is
// the same as one 2048² map; the environment is captured only once.
export function createStudioLighting(renderer, scene) {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const hemisphere = new THREE.HemisphereLight(0xf6f8ff, 0x746958, .20);
  const offsets = [[-.34,-.52],[.34,-.52],[-.34,.52],[.34,.52]];
  const keys = offsets.map(() => {
    const light = new THREE.DirectionalLight(0xfffaf2, .7);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, {left:-5.8, right:5.8, top:5.8, bottom:-5.8, near:.1, far:24});
    light.shadow.bias = -.00006;
    light.shadow.normalBias = .002;
    light.shadow.radius = 1;
    return light;
  });
  const fill = new THREE.DirectionalLight(0xebf2ff, .12);
  fill.position.set(4, -4, 4);
  scene.add(hemisphere, ...keys, fill);

  const room = new THREE.Scene();
  room.background = new THREE.Color(.045, .048, .052);
  // A soft-edged luminance mask makes one continuous photographic highlight
  // instead of hard white rectangles reflected in the acetate and painted wire.
  const image = document.createElement('canvas');
  image.width = image.height = 256;
  const context = image.getContext('2d');
  const pixels = context.createImageData(256, 256);
  const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const edgeX = smooth(Math.min(x, 255 - x) / 42);
    const edgeY = smooth(Math.min(y, 255 - y) / 30);
    const falloff = 1 - .16 * Math.pow((x - 128) / 128, 2);
    const value = Math.round(255 * (.015 + .985 * edgeX * edgeY * falloff));
    const i = (y * 256 + x) * 4;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const softbox = new THREE.CanvasTexture(image);
  softbox.colorSpace = THREE.NoColorSpace;
  const cards = [
    {p:[-2, 4, 5], size:[3.2, 4.8], color:[3.6,3.5,3.35]},
    {p:[3.5, -1, 3], size:[.85, 4], color:[1.45,1.55,1.7]},
    {p:[0, 4, 2.5], size:[4.5, .7], color:[.65,.69,.75]},
  ];
  for (const {p,size,color} of cards) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({color:new THREE.Color(...color), map:softbox, side:THREE.DoubleSide}));
    panel.position.set(...p); panel.lookAt(0,0,0); room.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .025);
  scene.environment = environment.texture;
  room.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  softbox.dispose();
  pmrem.dispose();
  let disposed = false;
  return {
    key: keys[0],
    update(config) {
      if (disposed) return;
      const a=config.azimuth*Math.PI/180, e=config.elevation*Math.PI/180;
      const direction = new THREE.Vector3(Math.cos(a)*Math.cos(e), Math.sin(a)*Math.cos(e), Math.sin(e));
      const horizontal = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
      const vertical = new THREE.Vector3(-Math.cos(a)*Math.sin(e), -Math.sin(a)*Math.sin(e), Math.cos(e));
      keys.forEach((light, index) => {
        light.position.copy(direction).multiplyScalar(9)
          .addScaledVector(horizontal, offsets[index][0])
          .addScaledVector(vertical, offsets[index][1]);
        light.intensity = config.intensity / keys.length;
      });
      scene.environmentRotation.z=a-145*Math.PI/180;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(hemisphere, ...keys, fill);
      for (const light of keys) light.shadow.dispose();
      if (scene.environment === environment.texture) scene.environment = null;
      environment.dispose();
    },
  };
}
