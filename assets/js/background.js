/* background.js
 * ─────────────────────────────────────────────────────────────
 * The full-screen aurora. The CSS fallback (#bg-fallback,
 * animations.css) paints FIRST, always. If the device passes the
 * capability gate, Three.js is dynamically imported after first
 * paint and the WebGL canvas crossfades in over 400ms.
 *
 * Exports: initBackground(), bloom(strength)
 *
 * TUNE:
 *   TIME_SPEED   0.06  — shader drift, units/sec. A breath, not a lava lamp.
 *   MOUSE_LERP   0.045 — pointer easing per frame
 *   MOUSE_WARP   0.06  — max field warp as fraction of screen width
 *   DPR_CAP      1.5
 *   GOVERNOR_MS  20    — median frame time that triggers a downgrade
 * ───────────────────────────────────────────────────────────── */
import { CONFIG } from './config.js';
import { clamp, lerp, prefersReducedMotion } from './utils.js';

const TIME_SPEED = 0.06;
const MOUSE_LERP = 0.045;
const MOUSE_WARP = 0.06;
const DPR_CAP = 1.5;
const GOVERNOR_MS = 20;

let state = null;

/* Public: pulse the bloom (page enter, primary-CTA hover). */
export function bloom(strength = 1) {
  if (state) state.bloomTarget = clamp(strength, 0, 1);
}

/* ── Capability gate (§5.6) ──────────────────────────────────
 * Skip WebGL only for: no WebGL2, hardwareConcurrency < 4,
 * reduced motion, or forceCssBackground. Deliberately NOT gated:
 * deviceMemory (undefined in Safari/FF), `<= 4` cores (would
 * exclude every iPhone), coarse pointers. The frame-time governor
 * makes the call on genuinely weak hardware. */
function passesGate() {
  if (CONFIG.MOTION.forceCssBackground) return false;
  if (CONFIG.MOTION.intensity === 0) return false;
  if (prefersReducedMotion()) return false;
  if ((navigator.hardwareConcurrency || 8) < 4) return false;
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) return false;
  } catch (_) { return false; }
  return true;
}

const VERT = /* glsl */`
  out vec2 vUv;
  void main() {
    // full-screen triangle
    vec2 pos = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
    vUv = pos * 0.5 + 0.5;
    gl_Position = vec4(pos, 0.0, 1.0);
  }`;

const FRAG = /* glsl */`
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;

  uniform float uTime;        // slow — ~0.06 u/s
  uniform vec2  uResolution;
  uniform vec2  uMouse;       // NDC, lerped
  uniform float uScroll;      // 0→1 document progress
  uniform float uMood;        // 0 calm · .5 warm · 1 deep
  uniform float uIntensity;   // master dial
  uniform float uBloom;       // pulse, decays outside
  uniform float uOctaves;     // 3.0 → governor may drop to 2.0

  /* Everkind ramp — matched to everkind.com's pink-sky hero */
  const vec3 PALE   = vec3(0.984, 0.969, 0.984);  // #FBF7FB page ground
  const vec3 LAV    = vec3(0.910, 0.835, 0.961);  // #E8D5F5
  const vec3 LAV2   = vec3(0.851, 0.737, 0.941);  // deeper lavender
  const vec3 LILAC  = vec3(0.788, 0.655, 0.902);  // #C9A7E6
  const vec3 BLUSH  = vec3(0.949, 0.776, 0.863);  // #F2C6DC
  const vec3 PINK   = vec3(0.957, 0.667, 0.792);  // sunset pink core
  const vec3 CREAM  = vec3(0.965, 0.949, 0.933);  // #F6F2EE

  /* simplex noise (Ashima / IQ derivative, public domain) */
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p, float oct) {
    float v = 0.0, a = 0.55, f = 1.0;
    for (int i = 0; i < 3; i++) {
      if (float(i) >= oct) break;
      v += a * snoise(p * f);
      f *= 2.1; a *= 0.5;
    }
    return v;
  }

  /* 4x4 ordered dither — kills banding in the long dark falloff */
  float dither(vec2 frag) {
    int x = int(mod(frag.x, 4.0));
    int y = int(mod(frag.y, 4.0));
    int idx = x + y * 4;
    float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
    return (m[idx] / 16.0 - 0.5) / 64.0;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2(uv.x * aspect, uv.y);
    float t = uTime;

    /* pointer warp — ≤6% of screen width, never a spotlight */
    vec2 mouse = uMouse * 0.5 + 0.5;
    vec2 toMouse = p - vec2(mouse.x * aspect, mouse.y);
    p += normalize(toMouse + 1e-4) * exp(-dot(toMouse, toMouse) * 3.0) * -${MOUSE_WARP.toFixed(3)} * uIntensity;

    /* domain warp */
    vec2 q = vec2(fbm(p * 1.4 + t * 0.35, uOctaves),
                  fbm(p * 1.4 - t * 0.28 + 5.2, uOctaves));
    float n = fbm(p * 1.9 + q * 0.9 + t * 0.22, uOctaves);

    /* aurora band centred ~22% from the top, drifting ±8% over ~40s */
    float bandCentre = 0.78 + sin(t * 0.157) * 0.08;
    float band = smoothstep(0.42, 0.02, abs(uv.y - bandCentre) - n * 0.16);

    /* scroll drift: lavender-led top → pink-led middle → soft cream foot */
    vec3 hi  = mix(LAV2, PINK,  smoothstep(0.15, 0.55, uScroll));
    hi       = mix(hi,   LILAC, smoothstep(0.72, 1.0, uScroll) * 0.7);
    vec3 mid = mix(LAV,  BLUSH, smoothstep(0.3, 0.9, uScroll) * 0.6);

    /* mood: 0 calm · .5 warm · 1 deep (quieter, greyer) */
    float warm = 1.0 - abs(uMood - 0.5) * 2.0;
    hi = mix(hi, PINK, warm * 0.25);
    float deep = smoothstep(0.5, 1.0, uMood);

    vec3 col = PALE;

    /* depth haze — a broad lavender wash */
    float haze = fbm(p * 0.7 - t * 0.1 + 11.3, uOctaves) * 0.5 + 0.5;
    col = mix(col, LAV, haze * 0.4 * (1.0 - deep * 0.4));

    /* the sky band — soft sunset colour, never loud */
    col = mix(col, mid, band * (0.55 + n * 0.2) * (1.0 - deep * 0.35));
    col = mix(col, hi,  band * band * (0.45 + q.x * 0.2) * (1.0 - deep * 0.35));

    /* bloom core — warm pink glow at the band's brightest point */
    vec2 bloomPos = vec2(0.5 * aspect + q.y * 0.2, bandCentre + 0.02);
    float d = distance(vec2(uv.x * aspect, uv.y), bloomPos);
    float core = exp(-d * d * 6.0);
    col = mix(col, BLUSH, core * (0.35 + uBloom * 0.3) * (1.0 - deep * 0.4));

    /* settle to warm cream toward the page foot */
    col = mix(col, CREAM, smoothstep(0.45, 0.02, uv.y) * 0.5);

    col = mix(col, PALE, (1.0 - uIntensity) * 0.4);
    col += dither(gl_FragCoord.xy);

    outColor = vec4(col, 1.0);
  }`;

export async function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || !passesGate()) return;

  let THREE;
  try {
    THREE = await import('three');
  } catch (err) {
    console.info('[everkind] Three.js unavailable — CSS aurora stays on duty.');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse:      { value: new THREE.Vector2(0, 0) },
    uScroll:     { value: 0 },
    uMood:       { value: 0 },
    uIntensity:  { value: CONFIG.MOTION.intensity },
    uBloom:      { value: 0 },
    uOctaves:    { value: 3.0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG, glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false,
  });
  // Full-screen triangle: 3 vertices, positions computed from gl_VertexID.
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  geo.setDrawRange(0, 3);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  state = {
    bloomTarget: 0,
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
    mood: 0, moodTarget: 0,
    paused: false, occluded: false, unmounted: false,
  };

  /* pointer → uMouse (lerped in the loop) */
  window.addEventListener('pointermove', (e) => {
    state.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  /* section moods via data-bg-mood (0 | 0.5 | 1) */
  const moodSections = document.querySelectorAll('[data-bg-mood]');
  if (moodSections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) state.moodTarget = parseFloat(e.target.dataset.bgMood) || 0;
      }
    }, { rootMargin: '-40% 0px -40% 0px' });
    moodSections.forEach((s) => io.observe(s));
  }

  document.addEventListener('visibilitychange', () => {
    state.paused = document.hidden;
  });
  /* Light-section scrims set this flag from reveals.js */
  window.addEventListener('ek:occlusion', (e) => { state.occluded = !!e.detail; });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });

  /* ── Frame-time governor (§5.6) ──
   * Rolling 120-frame median, measured only from 2s after the first
   * frame (earlier frames are font swap / decode / GSAP init noise).
   * Two consecutive windows over GOVERNOR_MS → downgrade. */
  let frameTimes = [], lastFrame = 0, firstFrameAt = 0, slowWindows = 0, downgraded = false;

  const unmount = () => {
    state.unmounted = true;
    canvas.classList.remove('is-live'); // 400ms CSS crossfade back to fallback
    setTimeout(() => {
      renderer.dispose(); geo.dispose(); material.dispose();
    }, 450);
    console.info('[everkind] Aurora: WebGL retired for this device — CSS fallback active.');
  };

  const governor = (now) => {
    if (!firstFrameAt) { firstFrameAt = now; return; }
    if (now - firstFrameAt < 2000) { lastFrame = now; return; }
    if (lastFrame) {
      frameTimes.push(now - lastFrame);
      if (frameTimes.length >= 120) {
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const median = sorted[60];
        frameTimes = [];
        if (median > GOVERNOR_MS) {
          slowWindows += 1;
          if (slowWindows >= 2) {
            if (!downgraded) {
              downgraded = true; slowWindows = 0;
              uniforms.uOctaves.value = 2.0;
              console.info('[everkind] Aurora: dropped to 2 noise octaves.');
            } else {
              unmount();
            }
          }
        } else {
          slowWindows = 0;
        }
      }
    }
    lastFrame = now;
  };

  const docHeight = () =>
    Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  let stillFrameDrawn = false;
  const loop = (now) => {
    if (state.unmounted) return;
    requestAnimationFrame(loop);
    if (state.paused || state.occluded) { lastFrame = 0; return; }

    if (uniforms.uIntensity.value === 0) {
      if (stillFrameDrawn) return;           // §5.2: one still frame, then stop
      stillFrameDrawn = true;
    }

    uniforms.uTime.value = (now / 1000) * TIME_SPEED;
    state.mouse.x = lerp(state.mouse.x, state.mouse.tx, MOUSE_LERP);
    state.mouse.y = lerp(state.mouse.y, state.mouse.ty, MOUSE_LERP);
    uniforms.uMouse.value.set(state.mouse.x, state.mouse.y);
    uniforms.uScroll.value = clamp(window.scrollY / docHeight(), 0, 1);

    /* mood eases over ~800ms */
    state.mood = lerp(state.mood, state.moodTarget, 0.06);
    uniforms.uMood.value = state.mood;

    /* bloom decays over ~1.2s */
    uniforms.uBloom.value = lerp(uniforms.uBloom.value, state.bloomTarget, 0.08);
    state.bloomTarget = lerp(state.bloomTarget, 0, 0.045);

    renderer.render(scene, camera);
    governor(now);
  };

  requestAnimationFrame(loop);
  requestAnimationFrame(() => canvas.classList.add('is-live')); // 400ms crossfade in

  /* page-enter bloom */
  bloom(0.9);
}
