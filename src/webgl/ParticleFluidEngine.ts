import * as THREE from 'three';
import { createMatcapTexture } from './matcap';
import {
  FLUID_ADVECT_FRAG,
  FLUID_CLEAR_FRAG,
  FLUID_CURL_FRAG,
  FLUID_DIVERGENCE_FRAG,
  FLUID_GRADIENT_SUBTRACT_FRAG,
  FLUID_MASK_FRAG,
  FLUID_PRESSURE_FRAG,
  FLUID_SPLAT_FRAG,
  FLUID_VORTICITY_FRAG,
  FULLSCREEN_VERT,
  PARTICLE_RENDER_FRAG,
  PARTICLE_RENDER_VERT,
  PARTICLE_SIM_FRAG,
} from './shaders';

interface DoubleFBO {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
  dispose: () => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function clampMap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

function createFBO(
  width: number,
  height: number,
  type: THREE.TextureDataType,
  filter: THREE.MagnificationTextureFilter,
): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    type,
    format: THREE.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

function createDoubleFBO(
  width: number,
  height: number,
  type: THREE.TextureDataType,
  filter: THREE.MagnificationTextureFilter,
): DoubleFBO {
  let read = createFBO(width, height, type, filter);
  let write = createFBO(width, height, type, filter);
  return {
    get read() {
      return read;
    },
    get write() {
      return write;
    },
    swap() {
      const tmp = read;
      read = write;
      write = tmp;
    },
    dispose() {
      read.dispose();
      write.dispose();
    },
  };
}

export class ParticleFluidEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private quadScene: THREE.Scene;
  private quadCamera: THREE.OrthographicCamera;
  private quadMesh: THREE.Mesh;
  private particleGroup: THREE.Group;
  private points: THREE.Points;
  private pointsMaterial: THREE.ShaderMaterial;
  private matcapTexture: THREE.CanvasTexture;

  private isSoftwareGl: boolean;
  private isMobile: boolean;
  private simTexSize: number;

  // Fluid targets
  private readonly simRes = 256;
  private readonly dyeRes = 512;
  private velocityFBO: DoubleFBO;
  private densityFBO: DoubleFBO;
  private pressureFBO: DoubleFBO;
  private curlFBO: THREE.WebGLRenderTarget;
  private divergenceFBO: THREE.WebGLRenderTarget;
  private maskFBO: THREE.WebGLRenderTarget;

  // Particle ping-pong targets
  private posFBO: DoubleFBO;
  private originTex: THREE.DataTexture;
  private randomTex: THREE.DataTexture;

  // Fluid materials
  private splatMat: THREE.ShaderMaterial;
  private curlMat: THREE.ShaderMaterial;
  private vorticityMat: THREE.ShaderMaterial;
  private divergenceMat: THREE.ShaderMaterial;
  private clearMat: THREE.ShaderMaterial;
  private pressureMat: THREE.ShaderMaterial;
  private gradSubMat: THREE.ShaderMaterial;
  private advectMat: THREE.ShaderMaterial;
  private maskMat: THREE.ShaderMaterial;
  private particleSimMat: THREE.ShaderMaterial;

  // Pre-allocated math helpers (zero GC in loop)
  private readonly baseCameraPos = new THREE.Vector3(-1.17, 0, 6);
  private readonly targetCameraPos = new THREE.Vector3(-1.17, 0, 6);
  private readonly lookOrigin = new THREE.Vector3(0, 0, 0);
  private readonly projViewMatrix = new THREE.Matrix4();

  // Pointer & loop state
  private width = window.innerWidth;
  private height = window.innerHeight;
  private pointerX = window.innerWidth * 0.5;
  private pointerY = window.innerHeight * 0.5;
  private prevPointerX = window.innerWidth * 0.5;
  private prevPointerY = window.innerHeight * 0.5;
  private hasPointerMoved = false;
  private lastSplatTime = 0;
  private lastFrameTime = performance.now();
  private elapsedTime = 0;
  private frameCount = 0;
  private frameId = 0;
  private disposed = false;

  // Bound event listeners
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onTouchMoveBound: (e: TouchEvent) => void;
  private onResizeBound: () => void;
  private onContextLostBound: (e: Event) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.isMobile = window.innerWidth <= 760;
    this.simTexSize = this.isMobile ? 128 : 512;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearColor(0x0c0c0d, 1);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(this.width, this.height, false);

    // Ensure float / half-float render target extensions are active
    const gl = this.renderer.getContext();
    const hasFloatRT =
      Boolean(gl.getExtension('EXT_color_buffer_float')) ||
      Boolean(gl.getExtension('WEBGL_color_buffer_float'));
    const hasHalfFloatRT =
      Boolean(gl.getExtension('EXT_color_buffer_half_float')) || hasFloatRT;
    const hasFloatLinear =
      Boolean(gl.getExtension('OES_texture_float_linear')) ||
      Boolean(gl.getExtension('OES_texture_half_float_linear'));

    const particleType = hasFloatRT ? THREE.FloatType : THREE.HalfFloatType;
    const fluidType = hasHalfFloatRT ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const fluidFilter = hasFloatLinear ? THREE.LinearFilter : THREE.NearestFilter;

    // Main 3D scene & camera (exact spec from brief Section 7)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / Math.max(this.height, 1),
      0.1,
      1000,
    );
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.lookOrigin);

    // Offscreen fullscreen quad scene
    this.quadScene = new THREE.Scene();
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(quadGeo);
    this.quadScene.add(this.quadMesh);

    // Fluid FBOs
    this.velocityFBO = createDoubleFBO(
      this.simRes,
      this.simRes,
      fluidType,
      fluidFilter,
    );
    this.densityFBO = createDoubleFBO(
      this.dyeRes,
      this.dyeRes,
      fluidType,
      fluidFilter,
    );
    this.pressureFBO = createDoubleFBO(
      this.simRes,
      this.simRes,
      fluidType,
      THREE.NearestFilter,
    );
    this.curlFBO = createFBO(
      this.simRes,
      this.simRes,
      fluidType,
      THREE.NearestFilter,
    );
    this.divergenceFBO = createFBO(
      this.simRes,
      this.simRes,
      fluidType,
      THREE.NearestFilter,
    );
    this.maskFBO = createFBO(
      Math.max(2, Math.floor(this.width * 0.5)),
      Math.max(2, Math.floor(this.height * 0.5)),
      THREE.UnsignedByteType,
      THREE.LinearFilter,
    );

    // Fluid shader materials
    const simTexel = new THREE.Vector2(1 / this.simRes, 1 / this.simRes);
    const dyeTexel = new THREE.Vector2(1 / this.dyeRes, 1 / this.dyeRes);

    this.splatMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_SPLAT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTarget: { value: null },
        uPoint: { value: new THREE.Vector2() },
        uPrevPoint: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: 0.01 },
        uAspect: { value: this.width / Math.max(this.height, 1) },
      },
    });

    this.curlMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_CURL_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: simTexel },
      },
    });

    this.vorticityMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_VORTICITY_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        uTexelSize: { value: simTexel },
        uCurlStrength: { value: 30.0 },
        uDt: { value: 1 / 60 },
      },
    });

    this.divergenceMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_DIVERGENCE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: simTexel },
      },
    });

    this.clearMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_CLEAR_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTexture: { value: null },
        uValue: { value: 0.95 },
      },
    });

    this.pressureMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_PRESSURE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexelSize: { value: simTexel },
      },
    });

    this.gradSubMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_GRADIENT_SUBTRACT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexelSize: { value: simTexel },
      },
    });

    this.advectMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_ADVECT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexelSize: { value: simTexel.clone() },
        uDt: { value: 1 / 60 },
        uDissipation: { value: 0.98 },
      },
    });
    // Store dye texel reference for dye advection
    this.advectMat.userData = { simTexel, dyeTexel };

    this.maskMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FLUID_MASK_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uDensity: { value: null },
      },
    });

    // Particle initial origin & random textures
    const count = this.simTexSize * this.simTexSize;
    const originData = new Float32Array(count * 4);
    const randomData = new Float32Array(count * 4);
    const uvPositions = new Float32Array(count * 3);
    const randomAttrs = new Float32Array(count * 4);

    // Deterministic LCG PRNG so particle distribution is rich and reproducible
    let seed = 13374209;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const i4 = i * 4;
      const i3 = i * 3;
      const ix = i % this.simTexSize;
      const iy = Math.floor(i / this.simTexSize);

      originData[i4] = rand() * 2 - 1;
      originData[i4 + 1] = rand() * 2 - 1;
      originData[i4 + 2] = rand() * 2 - 1;
      originData[i4 + 3] = 1.0;

      const r0 = rand();
      const r1 = rand();
      const r2 = rand();
      const r3 = rand();
      randomData[i4] = r0;
      randomData[i4 + 1] = r1;
      randomData[i4 + 2] = r2;
      randomData[i4 + 3] = r3;

      randomAttrs[i4] = r0;
      randomAttrs[i4 + 1] = r1;
      randomAttrs[i4 + 2] = r2;
      randomAttrs[i4 + 3] = r3;

      uvPositions[i3] = (ix + 0.5) / this.simTexSize;
      uvPositions[i3 + 1] = (iy + 0.5) / this.simTexSize;
      uvPositions[i3 + 2] = 0;
    }

    this.originTex = new THREE.DataTexture(
      originData,
      this.simTexSize,
      this.simTexSize,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.originTex.minFilter = THREE.NearestFilter;
    this.originTex.magFilter = THREE.NearestFilter;
    this.originTex.needsUpdate = true;

    this.randomTex = new THREE.DataTexture(
      randomData,
      this.simTexSize,
      this.simTexSize,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.randomTex.minFilter = THREE.NearestFilter;
    this.randomTex.magFilter = THREE.NearestFilter;
    this.randomTex.needsUpdate = true;

    this.posFBO = createDoubleFBO(
      this.simTexSize,
      this.simTexSize,
      particleType,
      THREE.NearestFilter,
    );

    // Seed initial position FBO with origin texture
    const copyMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uSource;
        void main() { gl_FragColor = texture2D(uSource, vUv); }
      `,
      depthTest: false,
      depthWrite: false,
      uniforms: { uSource: { value: this.originTex } },
    });
    this.quadMesh.material = copyMat;
    this.renderer.setRenderTarget(this.posFBO.read);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(this.posFBO.write);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(null);
    copyMat.dispose();

    // Particle group transform (exact Section 7 spec)
    this.particleGroup = new THREE.Group();
    this.particleGroup.position.set(0.343, 0.16, -1);
    this.particleGroup.rotation.set(
      THREE.MathUtils.degToRad(-28.4),
      THREE.MathUtils.degToRad(390),
      THREE.MathUtils.degToRad(4.92),
    );
    this.particleGroup.scale.set(5, 5, 6);
    this.particleGroup.updateMatrixWorld(true);

    this.particleSimMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: PARTICLE_SIM_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPositions: { value: this.posFBO.read.texture },
        uOrigins: { value: this.originTex },
        uRandom: { value: this.randomTex },
        uFluidVelocity: { value: this.velocityFBO.read.texture },
        uFluidDensity: { value: this.maskFBO.texture },
        uProjViewMatrix: { value: this.projViewMatrix },
        uModelMatrix: { value: this.particleGroup.matrixWorld },
        uCameraWorldMatrix: { value: this.camera.matrixWorld },
        uTime: { value: 0 },
        uHz: { value: 1 },
        uMouseStrength: { value: 0.72 },
      },
    });

    // Procedural 64x64 matcap
    this.matcapTexture = createMatcapTexture().texture;

    // Point cloud geometry & material
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(uvPositions, 3));
    pointsGeo.setAttribute('aRandom', new THREE.BufferAttribute(randomAttrs, 4));

    this.pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_RENDER_VERT,
      fragmentShader: PARTICLE_RENDER_FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPositions: { value: this.posFBO.read.texture },
        uMatcap: { value: this.matcapTexture },
        uTime: { value: 0 },
        uDpr: { value: this.renderer.getPixelRatio() },
      },
    });

    this.points = new THREE.Points(pointsGeo, this.pointsMaterial);
    this.points.frustumCulled = false;
    this.particleGroup.add(this.points);
    this.scene.add(this.particleGroup);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Bind events
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onTouchMoveBound = this.handleTouchMove.bind(this);
    this.onResizeBound = this.handleResize.bind(this);
    this.onContextLostBound = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
    window.addEventListener('touchstart', this.onTouchMoveBound, { passive: true });
    window.addEventListener('touchmove', this.onTouchMoveBound, { passive: true });
    window.addEventListener('resize', this.onResizeBound, { passive: true });
    this.canvas.addEventListener('webglcontextlost', this.onContextLostBound);

    this.canvas.dataset.ready = 'true';
    this.startLoop();
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.hasPointerMoved) {
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.hasPointerMoved = true;
    }
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
  }

  private handleTouchMove(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    if (!this.hasPointerMoved) {
      this.prevPointerX = touch.clientX;
      this.prevPointerY = touch.clientY;
      this.hasPointerMoved = true;
    }
    this.pointerX = touch.clientX;
    this.pointerY = touch.clientY;
  }

  private handleResize(): void {
    if (this.disposed) return;
    this.width = window.innerWidth;
    this.height = Math.max(window.innerHeight, 1);
    this.isMobile = this.width <= 760;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    const dpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.pointsMaterial.uniforms.uDpr.value = dpr;
    this.splatMat.uniforms.uAspect.value = this.width / this.height;

    this.maskFBO.setSize(
      Math.max(2, Math.floor(this.width * 0.5)),
      Math.max(2, Math.floor(this.height * 0.5)),
    );
  }

  private runQuadPass(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null,
  ): void {
    this.quadMesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  private stepFluid(now: number): void {
    const dx = this.pointerX - this.prevPointerX;
    const dy = this.pointerY - this.prevPointerY;
    const len = Math.hypot(dx, dy);

    if (this.hasPointerMoved && len > 0.01) {
      const mobileFactor = this.isMobile ? 0.8 : 0.6;
      const splatRadius = clampMap(len, 0, 5, 0, 60) * mobileFactor;
      const mult = clampMap(len, 0, 15, 0, 10);

      const curU = this.pointerX / Math.max(this.width, 1);
      const curV = 1.0 - this.pointerY / Math.max(this.height, 1);
      const useCurrentAsStart = now - this.lastSplatTime > 50;
      const prevU = useCurrentAsStart
        ? curU
        : this.prevPointerX / Math.max(this.width, 1);
      const prevV = useCurrentAsStart
        ? curV
        : 1.0 - this.prevPointerY / Math.max(this.height, 1);

      this.splatMat.uniforms.uPoint.value.set(curU, curV);
      this.splatMat.uniforms.uPrevPoint.value.set(prevU, prevV);
      this.splatMat.uniforms.uRadius.value = Math.max(splatRadius / 200, 0.004);
      this.splatMat.uniforms.uAspect.value = this.width / Math.max(this.height, 1);

      // Velocity splat
      this.splatMat.uniforms.uTarget.value = this.velocityFBO.read.texture;
      this.splatMat.uniforms.uColor.value.set(dx * mult, -dy * mult, 1.0);
      this.runQuadPass(this.splatMat, this.velocityFBO.write);
      this.velocityFBO.swap();

      // Density splat (white)
      this.splatMat.uniforms.uTarget.value = this.densityFBO.read.texture;
      this.splatMat.uniforms.uColor.value.set(1.0, 1.0, 1.0);
      this.runQuadPass(this.splatMat, this.densityFBO.write);
      this.densityFBO.swap();

      this.lastSplatTime = now;
    }

    this.prevPointerX = this.pointerX;
    this.prevPointerY = this.pointerY;

    // 1. Curl
    this.curlMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.runQuadPass(this.curlMat, this.curlFBO);

    // 2. Vorticity confinement
    this.vorticityMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.vorticityMat.uniforms.uCurl.value = this.curlFBO.texture;
    this.runQuadPass(this.vorticityMat, this.velocityFBO.write);
    this.velocityFBO.swap();

    // 3. Divergence
    this.divergenceMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.runQuadPass(this.divergenceMat, this.divergenceFBO);

    // 4. Pressure dissipation + 5 Jacobi iterations
    this.clearMat.uniforms.uTexture.value = this.pressureFBO.read.texture;
    this.clearMat.uniforms.uValue.value = 0.95;
    this.runQuadPass(this.clearMat, this.pressureFBO.write);
    this.pressureFBO.swap();

    this.pressureMat.uniforms.uDivergence.value = this.divergenceFBO.texture;
    for (let i = 0; i < 5; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressureFBO.read.texture;
      this.runQuadPass(this.pressureMat, this.pressureFBO.write);
      this.pressureFBO.swap();
    }

    // 5. Gradient subtract
    this.gradSubMat.uniforms.uPressure.value = this.pressureFBO.read.texture;
    this.gradSubMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.runQuadPass(this.gradSubMat, this.velocityFBO.write);
    this.velocityFBO.swap();

    // 6. Advect velocity (dissipation 0.98)
    const { simTexel, dyeTexel } = this.advectMat.userData as {
      simTexel: THREE.Vector2;
      dyeTexel: THREE.Vector2;
    };
    this.advectMat.uniforms.uTexelSize.value.copy(simTexel);
    this.advectMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.advectMat.uniforms.uSource.value = this.velocityFBO.read.texture;
    this.advectMat.uniforms.uDissipation.value = 0.98;
    this.runQuadPass(this.advectMat, this.velocityFBO.write);
    this.velocityFBO.swap();

    // 7. Advect density (dissipation 0.97)
    this.advectMat.uniforms.uTexelSize.value.copy(dyeTexel);
    this.advectMat.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.advectMat.uniforms.uSource.value = this.densityFBO.read.texture;
    this.advectMat.uniforms.uDissipation.value = 0.97;
    this.runQuadPass(this.advectMat, this.densityFBO.write);
    this.densityFBO.swap();

    // 8. Display / mask target
    this.maskMat.uniforms.uDensity.value = this.densityFBO.read.texture;
    this.runQuadPass(this.maskMat, this.maskFBO);
  }

  private stepParticles(hz: number): void {
    this.camera.updateMatrixWorld();
    this.particleGroup.updateMatrixWorld();
    this.projViewMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );

    this.particleSimMat.uniforms.uPositions.value = this.posFBO.read.texture;
    this.particleSimMat.uniforms.uFluidVelocity.value = this.velocityFBO.read.texture;
    this.particleSimMat.uniforms.uFluidDensity.value = this.maskFBO.texture;
    this.particleSimMat.uniforms.uProjViewMatrix.value.copy(this.projViewMatrix);
    this.particleSimMat.uniforms.uModelMatrix.value.copy(this.particleGroup.matrixWorld);
    this.particleSimMat.uniforms.uCameraWorldMatrix.value.copy(this.camera.matrixWorld);
    this.particleSimMat.uniforms.uTime.value = this.elapsedTime;
    this.particleSimMat.uniforms.uHz.value = hz;

    this.runQuadPass(this.particleSimMat, this.posFBO.write);
    this.posFBO.swap();
  }

  private updateGazeCamera(hz: number): void {
    const mx = (this.pointerX / Math.max(this.width, 1)) * 2 - 1;
    const my = (this.pointerY / Math.max(this.height, 1)) * 2 - 1;

    this.targetCameraPos.set(
      this.baseCameraPos.x + mx * -1.0,
      this.baseCameraPos.y + my * 2.0,
      this.baseCameraPos.z,
    );

    const alpha = 1 - Math.pow(0.95, Math.max(hz, 0.2));
    this.camera.position.lerp(this.targetCameraPos, alpha);
    this.camera.lookAt(this.lookOrigin);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;

      const now = performance.now();
      const rawDt = Math.max(0.001, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      const dt = Math.min(rawDt, 0.05);
      const hz = dt * 60;
      this.elapsedTime += dt;

      this.updateGazeCamera(hz);
      this.stepFluid(now);
      this.stepParticles(hz);

      this.pointsMaterial.uniforms.uPositions.value = this.posFBO.read.texture;
      this.pointsMaterial.uniforms.uTime.value = this.elapsedTime;

      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);

      this.frameCount += 1;
      if (this.frameCount <= 30 || this.frameCount % 30 === 0) {
        this.canvas.dataset.frames = String(this.frameCount);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = window.requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = window.requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('touchstart', this.onTouchMoveBound);
    window.removeEventListener('touchmove', this.onTouchMoveBound);
    window.removeEventListener('resize', this.onResizeBound);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLostBound);

    this.velocityFBO.dispose();
    this.densityFBO.dispose();
    this.pressureFBO.dispose();
    this.curlFBO.dispose();
    this.divergenceFBO.dispose();
    this.maskFBO.dispose();
    this.posFBO.dispose();

    this.originTex.dispose();
    this.randomTex.dispose();
    this.matcapTexture.dispose();

    this.splatMat.dispose();
    this.curlMat.dispose();
    this.vorticityMat.dispose();
    this.divergenceMat.dispose();
    this.clearMat.dispose();
    this.pressureMat.dispose();
    this.gradSubMat.dispose();
    this.advectMat.dispose();
    this.maskMat.dispose();
    this.particleSimMat.dispose();

    this.points.geometry.dispose();
    this.pointsMaterial.dispose();
    this.quadMesh.geometry.dispose();
    this.renderer.dispose();
  }
}
