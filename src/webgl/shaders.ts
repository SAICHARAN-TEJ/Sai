export const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const FLUID_SPLAT_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform vec2 uPoint;
  uniform vec2 uPrevPoint;
  uniform vec3 uColor;
  uniform float uRadius;
  uniform float uAspect;

  float distToSegmentSq(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float denom = dot(ba, ba);
    float h = denom > 1e-8 ? clamp(dot(pa, ba) / denom, 0.0, 1.0) : 0.0;
    vec2 d = pa - ba * h;
    return dot(d, d);
  }

  void main() {
    vec2 p = vUv;
    vec2 a = uPrevPoint;
    vec2 b = uPoint;
    p.x *= uAspect;
    a.x *= uAspect;
    b.x *= uAspect;

    float d2 = distToSegmentSq(p, a, b);
    float r = max(uRadius, 0.0005);
    float splat = exp(-d2 / (r * r));
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + uColor * splat, 1.0);
  }
`;

export const FLUID_CURL_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;

  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

export const FLUID_VORTICITY_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 uTexelSize;
  uniform float uCurlStrength;
  uniform float uDt;

  void main() {
    float L = texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;

    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel += force * uDt;
    vel = clamp(vel, vec2(-1000.0), vec2(1000.0));
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

export const FLUID_DIVERGENCE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;

  void main() {
    vec2 uvL = vUv - vec2(uTexelSize.x, 0.0);
    vec2 uvR = vUv + vec2(uTexelSize.x, 0.0);
    vec2 uvT = vUv + vec2(0.0, uTexelSize.y);
    vec2 uvB = vUv - vec2(0.0, uTexelSize.y);

    float L = texture2D(uVelocity, uvL).x;
    float R = texture2D(uVelocity, uvR).x;
    float T = texture2D(uVelocity, uvT).y;
    float B = texture2D(uVelocity, uvB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;

    if (uvL.x < 0.0) L = -C.x;
    if (uvR.x > 1.0) R = -C.x;
    if (uvT.y > 1.0) T = -C.y;
    if (uvB.y < 0.0) B = -C.y;

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

export const FLUID_CLEAR_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uValue;

  void main() {
    gl_FragColor = uValue * texture2D(uTexture, vUv);
  }
`;

export const FLUID_PRESSURE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float div = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - div) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

export const FLUID_GRADIENT_SUBTRACT_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel -= vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

export const FLUID_ADVECT_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;

  void main() {
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
    vec4 result = texture2D(uSource, clamp(coord, 0.0, 1.0));
    gl_FragColor = result * uDissipation;
  }
`;

export const FLUID_MASK_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uDensity;

  void main() {
    vec3 c = texture2D(uDensity, vUv).rgb;
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
`;

export const PARTICLE_SIM_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uPositions;
  uniform sampler2D uOrigins;
  uniform sampler2D uRandom;
  uniform sampler2D uFluidVelocity;
  uniform sampler2D uFluidDensity;
  uniform mat4 uProjViewMatrix;
  uniform mat4 uModelMatrix;
  uniform mat4 uCameraWorldMatrix;
  uniform float uTime;
  uniform float uHz;
  uniform float uMouseStrength;

  // Analytic Bridson-style curl of three smooth sine-sum potentials, normalized
  vec3 curlNoise(vec3 p) {
    // Potential A = sin(p.y * 3.1 + 0.7) * cos(p.z * 2.7 - 0.4) + 0.5 * sin(p.x * 2.3 + p.y * 1.9)
    // Potential B = sin(p.z * 2.9 - 1.1) * cos(p.x * 3.3 + 0.5) + 0.5 * sin(p.y * 2.5 + p.z * 1.7)
    // Potential C = sin(p.x * 2.8 + 0.3) * cos(p.y * 3.0 + 1.2) + 0.5 * sin(p.z * 2.1 + p.x * 2.4)
    float dC_dy = -3.0 * sin(p.x * 2.8 + 0.3) * sin(p.y * 3.0 + 1.2);
    float dB_dz = 2.9 * cos(p.z * 2.9 - 1.1) * cos(p.x * 3.3 + 0.5) + 0.85 * cos(p.y * 2.5 + p.z * 1.7);

    float dA_dz = -2.7 * sin(p.y * 3.1 + 0.7) * sin(p.z * 2.7 - 0.4);
    float dC_dx = 2.8 * cos(p.x * 2.8 + 0.3) * cos(p.y * 3.0 + 1.2) + 1.2 * cos(p.z * 2.1 + p.x * 2.4);

    float dB_dx = -3.3 * sin(p.z * 2.9 - 1.1) * sin(p.x * 3.3 + 0.5);
    float dA_dy = 3.1 * cos(p.y * 3.1 + 0.7) * cos(p.z * 2.7 - 0.4) + 0.95 * cos(p.x * 2.3 + p.y * 1.9);

    vec3 c = vec3(dC_dy - dB_dz, dA_dz - dC_dx, dB_dx - dA_dy);
    float len = length(c);
    return len > 1e-5 ? c / len : vec3(0.0, 1.0, 0.0);
  }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // Sculpted organic hollow twisted ring (~0.7 units across) with symmetric soft front/back seam
  float sdfShape(vec3 pIn) {
    vec3 p = pIn;
    // Mirror depth axis with soft seam
    p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012);

    // Rotate by unit quaternion (0.5, 0.5, 0.5, 0.5)
    vec4 q = vec4(0.5, 0.5, 0.5, 0.5);
    p = p + 2.0 * cross(q.xyz, cross(q.xyz, p) + q.w * p);

    if (length(p) > 0.8) {
      return length(p) - 0.7;
    }

    // Gentle organic twist and arch
    float twist = p.x * 1.55;
    float ct = cos(twist);
    float st = sin(twist);
    vec3 tp = p;
    tp.yz = mat2(ct, -st, st, ct) * tp.yz;
    tp.z += 0.068 * sin(tp.x * 4.4 + 0.35) + 0.042 * cos(tp.y * 3.6 - 0.25);

    // Primary hollow sculpted torus ring with organic angular lobe modulation
    float theta = atan(tp.y, tp.x);
    float majorR = 0.255 + 0.032 * sin(theta * 2.0 - 0.55) + 0.015 * cos(theta * 3.0 + 0.4);
    float minorR = 0.082 + 0.024 * sin(theta * 2.0 + 0.9) + 0.014 * cos(theta - 0.6);

    vec2 qTorus = vec2(length(tp.xy) - majorR, tp.z);
    float dRing = length(qTorus) - minorR;

    // Soft organic crest lobe blended smoothly onto the upper-right shoulder
    vec3 lobePos = tp - vec3(0.18, 0.16, 0.04);
    float dLobe1 = length(lobePos * vec3(1.1, 0.9, 1.35)) - 0.105;

    // Counter-balanced lower sweeping lobe
    vec3 lobe2Pos = tp - vec3(-0.21, -0.12, -0.02);
    float dLobe2 = length(lobe2Pos * vec3(0.95, 1.15, 1.3)) - 0.092;

    float d = smin(dRing, dLobe1, 0.09);
    d = smin(d, dLobe2, 0.085);

    // Subtle organic sine surface ripples
    d += 0.009 * sin(tp.x * 10.0) * cos(tp.y * 10.0) * sin(tp.z * 9.0);
    return d;
  }

  vec3 sdfNormal(vec3 p) {
    const float eps = 0.001;
    vec3 g = vec3(
      sdfShape(p + vec3(eps, 0.0, 0.0)) - sdfShape(p - vec3(eps, 0.0, 0.0)),
      sdfShape(p + vec3(0.0, eps, 0.0)) - sdfShape(p - vec3(0.0, eps, 0.0)),
      sdfShape(p + vec3(0.0, 0.0, eps)) - sdfShape(p - vec3(0.0, 0.0, eps))
    );
    float len = length(g);
    return len > 1e-6 ? g / len : vec3(0.0, 1.0, 0.0);
  }

  void main() {
    vec3 pos = texture2D(uPositions, vUv).xyz;
    vec3 origin = texture2D(uOrigins, vUv).xyz;

    if (length(pos) > 0.7) {
      pos /= 2.0;
    }

    // Curl noise drift
    pos += curlNoise(pos * 0.1 + uTime * 0.05) * 1.0 * 0.0002 * uHz;

    // SDF surface attraction + swirl
    vec3 gradient = sdfNormal(pos);
    float sdf = sdfShape(pos);
    float posLen = length(pos);
    vec3 nPos = posLen > 1e-5 ? pos / posLen : vec3(0.0, 1.0, 0.0);
    pos += cross(nPos, normalize(gradient)) * 0.0005;
    pos += -gradient * sdf * 0.5;
    pos += (origin - pos) * 0.0002 * uHz;

    // Cursor fluid push
    vec4 worldPos = uModelMatrix * vec4(pos, 1.0);
    vec4 clipPos = uProjViewMatrix * worldPos;
    vec2 screenUV = (clipPos.xy / max(clipPos.w, 0.0001)) * 0.5 + 0.5;
    float inBounds =
      step(0.0, screenUV.x) * step(screenUV.x, 1.0) *
      step(0.0, screenUV.y) * step(screenUV.y, 1.0);
    vec2 clampedUV = clamp(screenUV, 0.0, 1.0);

    vec2 fluidVel = texture2D(uFluidVelocity, clampedUV).xy;
    float fluidMask = texture2D(uFluidDensity, clampedUV).r * inBounds;
    vec3 flow = mat3(uCameraWorldMatrix) * vec3(fluidVel, 0.0);
    pos += flow * 0.0001 * uHz * uMouseStrength * fluidMask;

    gl_FragColor = vec4(pos, 1.0);
  }
`;

export const PARTICLE_RENDER_VERT = /* glsl */ `
  precision highp float;

  attribute vec4 aRandom;

  uniform sampler2D uPositions;
  uniform float uDpr;

  varying vec4 vRandom;
  varying float vScale;

  void main() {
    vec2 simUv = position.xy;
    vec3 pos = texture2D(uPositions, simUv).xyz;
    pos *= mix(1.0, 1.5, pow(aRandom.y, 150.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float distToCamera = length(mvPosition.xyz);
    float scale = smoothstep(3.0, 15.0, distToCamera) * mix(0.5, 1.0, aRandom.z);

    vRandom = aRandom;
    vScale = scale;

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 0.04 * uDpr * 2.0 * scale * (1000.0 / max(distToCamera, 0.1));
  }
`;

export const PARTICLE_RENDER_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uMatcap;
  uniform float uTime;

  varying vec4 vRandom;
  varying float vScale;

  float blendSoftLightCh(float base, float blend) {
    return (blend < 0.5)
      ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
      : (sqrt(max(base, 0.0)) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
  }

  vec3 blendSoftLight(vec3 base, vec3 blend) {
    return vec3(
      blendSoftLightCh(base.r, blend.r),
      blendSoftLightCh(base.g, blend.g),
      blendSoftLightCh(base.b, blend.b)
    );
  }

  float blendOverlayCh(float base, float blend) {
    return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
  }

  vec3 blendOverlay(vec3 base, vec3 blend) {
    return vec3(
      blendOverlayCh(base.r, blend.r),
      blendOverlayCh(base.g, blend.g),
      blendOverlayCh(base.b, blend.b)
    );
  }

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float dist = length(centered);
    if (dist > 0.5 || vScale < 0.1) {
      discard;
    }

    // Rotate sprite UV for subtle matcap glint variation
    float angle = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 rotUv = mat2(ca, -sa, sa, ca) * centered + 0.5;
    vec3 matcap = texture2D(uMatcap, clamp(rotUv, 0.0, 1.0)).rgb;

    // Base grey with sparse lavender accent points
    vec3 baseGrey = vec3(mix(0.0, 0.2, vRandom.x));
    vec3 lavender = vec3(0.6, 0.45, 1.0);
    float lavenderFactor = pow(vRandom.z, 100.0);
    vec3 color = mix(baseGrey, lavender, lavenderFactor);

    // Sparkle modulation
    float sparkle = 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5;
    color *= sparkle;

    // Blend matcap with soft-light 0.8 then overlay 0.2
    color = mix(color, blendSoftLight(clamp(color, 0.0, 1.0), matcap), 0.8);
    color = mix(color, blendOverlay(clamp(color, 0.0, 1.0), matcap), 0.2);

    // Soft radial disc edge so points stay silky
    float radialMask = smoothstep(0.5, 0.18, dist);
    color *= radialMask;

    gl_FragColor = vec4(color, 1.0);
  }
`;
