import * as THREE from 'three';
import gsap from 'gsap';
import { SPHERE_PROJECTS, type ShowcaseProject } from '../utils/projects';

export interface SphereCallbacks {
  onHoverChange?: (project: ShowcaseProject | null) => void;
  onZoomChange?: (project: ShowcaseProject | null, overviewOpen: boolean) => void;
  onReady?: () => void;
  backgroundColor?: number;
  placeholderColor?: number;
}

interface PlaneEntry {
  project: ShowcaseProject;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  basePos: THREE.Vector3;
  hasFrame: boolean;
  aspect: number;
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

export class SphereGalleryEngine {
  private container: HTMLElement;
  private callbacks: SphereCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sphereGroup: THREE.Group;
  private entries: PlaneEntry[] = [];

  private isSoftwareGl: boolean;
  private reducedMotion: boolean;
  private width = 1;
  private height = 1;

  // Spin & interaction state
  private velX = 0;
  private velY = 0;
  private targetAngleX = 0;
  private targetAngleY = 0;
  private smoothAngleX = 0;
  private smoothAngleY = 0;
  private hasInteracted = false;
  private isDragging = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private dragTravel = 0;
  private pointerNdc = new THREE.Vector2(99, 99);
  private pointerDirty = false;
  private hoveredEntry: PlaneEntry | null = null;

  // Zoom & overview animation state
  private zoomedEntry: PlaneEntry | null = null;
  private overviewOpen = false;
  private animState = {
    introProgress: 0,
    expand: 0,
    overviewBand: 0,
  };

  // Pre-allocated math helpers (zero GC in render loop)
  private readonly raycaster = new THREE.Raycaster();
  private readonly qYaw = new THREE.Quaternion();
  private readonly qPitch = new THREE.Quaternion();
  private readonly qAuto = new THREE.Quaternion();
  private readonly invSphereQuat = new THREE.Quaternion();
  private readonly axisY = new THREE.Vector3(0, 1, 0);
  private readonly axisX = new THREE.Vector3(1, 0, 0);
  private readonly autoAxis = new THREE.Vector3(
    Math.sin(THREE.MathUtils.degToRad(23)),
    Math.cos(THREE.MathUtils.degToRad(23)),
    0,
  ).normalize();
  private readonly tmpWorld = new THREE.Vector3();
  private readonly tmpDir = new THREE.Vector3();
  private readonly tmpLocalCenter = new THREE.Vector3();
  private readonly tmpTargetPos = new THREE.Vector3();

  private active = true;
  private disposed = false;
  private frameId = 0;
  private videoCheckTimer = 0;
  private frameCount = 0;

  // Bound handlers
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onResizeBound: () => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, callbacks: SphereCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion =
      new URLSearchParams(window.location.search).get('autostart') === '1';

    this.width = Math.max(container.clientWidth || window.innerWidth, 1);
    this.height = Math.max(container.clientHeight || window.innerHeight, 1);

    const bgHex = callbacks.backgroundColor ?? 0xf3f3f0;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !('ontouchstart' in window),
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(bgHex, 1);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.dataset.testid = 'sphere-canvas';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(bgHex);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 12);

    this.sphereGroup = new THREE.Group();
    this.scene.add(this.sphereGroup);

    this.buildPlanes();
    this.layoutFibonacciPositions();

    // Intro bloom
    if (this.reducedMotion) {
      this.animState.introProgress = 1;
      this.callbacks.onReady?.();
    } else {
      gsap.to(this.animState, {
        introProgress: 1,
        duration: 1.15,
        ease: 'power3.out',
        onComplete: () => {
          this.callbacks.onReady?.();
        },
      });
    }

    // Bind events
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onWheelBound = this.handleWheel.bind(this);
    this.onResizeBound = this.handleResize.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
    window.addEventListener('pointerup', this.onPointerUpBound);
    el.addEventListener('wheel', this.onWheelBound, { passive: true });
    window.addEventListener('resize', this.onResizeBound, { passive: true });
    window.addEventListener('keydown', this.onKeyDownBound);

    this.videoCheckTimer = window.setInterval(
      () => this.syncHemispherePlayback(),
      350,
    );
    this.syncHemispherePlayback();
    this.startLoop();
  }

  private pxToWorld(px: number): number {
    const visibleHeight = 2 * 12 * Math.tan(THREE.MathUtils.degToRad(30));
    return (px * visibleHeight) / Math.max(this.height, 1);
  }

  private getLayoutMetrics(): { radius: number; planeSize: number } {
    const w = this.width;
    const h = this.height;
    if (w <= 640) {
      const planeSize = 68;
      const byW = w * 0.5 - planeSize * 0.55 - 18;
      const byH = h * 0.5 - planeSize * 0.55 - 48;
      const radius = Math.max(96, Math.min(byW, byH, 155));
      return { radius, planeSize };
    }
    const planeSize = w <= 1440 ? 94 : 106;
    const byW = w * 0.5 - planeSize * 0.6 - 48;
    const byH = h * 0.5 - planeSize * 0.6 - 52;
    const radius = Math.max(150, Math.min(byW, byH, w <= 1440 ? 228 : 258));
    return { radius, planeSize };
  }

  private buildPlanes(): void {
    const sharedGeo = new THREE.PlaneGeometry(1, 1);

    SPHERE_PROJECTS.forEach((project, idx) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = idx < 12 ? 'auto' : 'metadata';
      video.src = project.videoUrl;

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const placeholderHex = this.callbacks.placeholderColor ?? 0xe4e4e0;
      const material = new THREE.MeshBasicMaterial({
        color: placeholderHex,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(sharedGeo, material);
      mesh.userData = { index: idx };
      this.sphereGroup.add(mesh);

      const entry: PlaneEntry = {
        project,
        mesh,
        video,
        texture,
        basePos: new THREE.Vector3(),
        hasFrame: false,
        aspect: 16 / 9,
      };

      const onFrameReady = () => {
        if (this.disposed || entry.hasFrame) return;
        entry.hasFrame = true;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          entry.aspect = video.videoWidth / video.videoHeight;
        }
        material.map = texture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      };

      video.addEventListener('loadeddata', onFrameReady);
      video.addEventListener('canplay', onFrameReady);

      // Stagger initial playback slightly so network stays smooth
      window.setTimeout(() => {
        if (this.disposed || !this.active) return;
        video.play().catch(() => {});
      }, 120 + idx * 45);

      this.entries.push(entry);
    });
  }

  private layoutFibonacciPositions(): void {
    const { radius } = this.getLayoutMetrics();
    const rWorld = this.pxToWorld(radius);
    const n = this.entries.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      const y = (i * 2) / n - 1 + 1 / n;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      this.entries[i].basePos.set(
        Math.cos(theta) * r * rWorld,
        y * rWorld,
        Math.sin(theta) * r * rWorld,
      );
    }
  }

  private syncHemispherePlayback(): void {
    if (this.disposed || !this.active) return;

    this.sphereGroup.updateMatrixWorld();
    for (const entry of this.entries) {
      if (this.zoomedEntry) {
        if (entry === this.zoomedEntry) {
          if (entry.video.paused) entry.video.play().catch(() => {});
        } else if (!entry.video.paused) {
          entry.video.pause();
        }
        continue;
      }

      this.tmpWorld.copy(entry.basePos).applyQuaternion(this.sphereGroup.quaternion);
      const len = this.tmpWorld.length();
      const zNorm = len > 1e-5 ? this.tmpWorld.z / len : 0;

      if (zNorm < -0.25) {
        if (!entry.video.paused) entry.video.pause();
      } else if (zNorm > -0.1) {
        if (entry.video.paused) entry.video.play().catch(() => {});
      }
    }
  }

  public setActive(active: boolean): void {
    if (this.active === active || this.disposed) return;
    this.active = active;
    if (!active) {
      window.cancelAnimationFrame(this.frameId);
      window.clearTimeout(this.frameId);
      for (const entry of this.entries) {
        if (!entry.video.paused) entry.video.pause();
      }
    } else {
      this.syncHemispherePlayback();
      this.startLoop();
    }
  }

  public closeZoom(): void {
    if (!this.zoomedEntry) return;
    this.overviewOpen = false;
    gsap.killTweensOf(this.animState);
    gsap.to(this.animState, {
      expand: 0,
      overviewBand: 0,
      duration: 0.65,
      ease: 'power3.out',
      onComplete: () => {
        this.zoomedEntry = null;
        this.callbacks.onZoomChange?.(null, false);
        this.syncHemispherePlayback();
      },
    });
    this.callbacks.onZoomChange?.(null, false);
  }

  public toggleOverview(): void {
    if (!this.zoomedEntry) return;
    this.overviewOpen = !this.overviewOpen;
    gsap.to(this.animState, {
      overviewBand: this.overviewOpen ? 1 : 0,
      duration: 0.7,
      ease: 'power4.out',
    });
    this.callbacks.onZoomChange?.(this.zoomedEntry.project, this.overviewOpen);
  }

  public openProjectById(projectId: number): void {
    const found = this.entries.find((e) => e.project.id === projectId);
    if (!found) return;
    this.zoomToEntry(found, true);
  }

  private zoomToEntry(entry: PlaneEntry, openDetails = false): void {
    this.hasInteracted = true;
    this.zoomedEntry = entry;
    this.overviewOpen = openDetails;
    if (entry.video.paused) entry.video.play().catch(() => {});

    gsap.killTweensOf(this.animState);
    gsap.to(this.animState, {
      expand: 1,
      overviewBand: openDetails ? 1 : 0,
      duration: 0.8,
      ease: 'power4.out',
    });
    this.callbacks.onZoomChange?.(entry.project, openDetails);
    this.syncHemispherePlayback();
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.active) return;
    this.isDragging = true;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.dragTravel = 0;
    this.updatePointerNdc(e.clientX, e.clientY);
    if (!this.zoomedEntry) {
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.active) return;
    this.updatePointerNdc(e.clientX, e.clientY);
    this.pointerDirty = true;

    if (this.isDragging && !this.zoomedEntry) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.dragTravel += Math.hypot(dx, dy);
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      if (this.dragTravel > 3) {
        this.hasInteracted = true;
      }
      this.velY += dx * 0.0012;
      this.velX += dy * 0.0012;
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.active || !this.isDragging) return;
    this.isDragging = false;
    const moved = Math.hypot(
      e.clientX - this.pointerDownX,
      e.clientY - this.pointerDownY,
    );

    if (moved < 6 && this.dragTravel < 10) {
      this.handleClick(e.clientX, e.clientY);
    }
    this.pointerDirty = true;
  }

  private handleClick(clientX: number, clientY: number): void {
    this.updatePointerNdc(clientX, clientY);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.entries.map((e) => e.mesh),
      false,
    );

    if (this.zoomedEntry) {
      const hitZoomed = hits.some((h) => h.object === this.zoomedEntry?.mesh);
      if (hitZoomed) {
        this.toggleOverview();
      } else {
        this.closeZoom();
      }
      return;
    }

    if (hits.length > 0) {
      const idx = hits[0].object.userData.index as number;
      const picked = this.entries[idx];
      if (picked) {
        this.zoomToEntry(picked, false);
      }
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.active || this.zoomedEntry) return;
    // Allow natural vertical page scrolling while gently nudging sphere spin on horizontal gestures
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.hasInteracted = true;
      this.velY += e.deltaX * 0.0003;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    if (e.key === 'Escape' && this.zoomedEntry) {
      this.closeZoom();
    }
  }

  private updatePointerNdc(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerNdc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private handleResize(): void {
    if (this.disposed) return;
    this.width = Math.max(this.container.clientWidth || window.innerWidth, 1);
    this.height = Math.max(this.container.clientHeight || window.innerHeight, 1);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(this.width, this.height, false);
    this.layoutFibonacciPositions();
  }

  private updateHoverRaycast(): void {
    if (!this.pointerDirty) return;
    this.pointerDirty = false;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.entries.map((e) => e.mesh),
      false,
    );

    const hitEntry =
      hits.length > 0
        ? this.entries[hits[0].object.userData.index as number] ?? null
        : null;

    if (!this.isDragging) {
      if (hitEntry) {
        this.renderer.domElement.style.cursor = 'pointer';
      } else if (!this.zoomedEntry) {
        this.renderer.domElement.style.cursor = 'grab';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }

    if (hitEntry !== this.hoveredEntry) {
      this.hoveredEntry = hitEntry;
      if (!this.zoomedEntry) {
        this.callbacks.onHoverChange?.(hitEntry ? hitEntry.project : null);
      }
    }
  }

  private updateSceneTransforms(): void {
    // Inertial spin
    if (!this.zoomedEntry) {
      this.targetAngleY += this.velY;
      this.targetAngleX += this.velX;
      this.velX *= 0.94;
      this.velY *= 0.94;

      const nextSmoothY =
        this.smoothAngleY + (this.targetAngleY - this.smoothAngleY) * 0.11;
      const nextSmoothX =
        this.smoothAngleX + (this.targetAngleX - this.smoothAngleX) * 0.11;
      const dY = nextSmoothY - this.smoothAngleY;
      const dX = nextSmoothX - this.smoothAngleX;
      this.smoothAngleY = nextSmoothY;
      this.smoothAngleX = nextSmoothX;

      if (Math.abs(dY) > 1e-6) {
        this.qYaw.setFromAxisAngle(this.axisY, dY);
        this.sphereGroup.quaternion.premultiply(this.qYaw);
      }
      if (Math.abs(dX) > 1e-6) {
        this.qPitch.setFromAxisAngle(this.axisX, dX);
        this.sphereGroup.quaternion.premultiply(this.qPitch);
      }

      if (!this.hasInteracted && !this.reducedMotion) {
        this.qAuto.setFromAxisAngle(this.autoAxis, 0.0014);
        this.sphereGroup.quaternion.premultiply(this.qAuto);
      }
      this.sphereGroup.quaternion.normalize();
    }

    this.invSphereQuat.copy(this.sphereGroup.quaternion).invert();

    const { planeSize } = this.getLayoutMetrics();
    const baseSizeWorld = this.pxToWorld(planeSize);
    const intro = this.animState.introProgress;
    const overshoot = 1 + 0.09 * Math.sin(Math.PI * intro);
    const expand = this.animState.expand;
    const overviewBandPx = 250 * this.animState.overviewBand;

    // Target zoomed size (70% of available vertical space, 16:9, capped to width)
    const availH = Math.max(200, this.height - overviewBandPx - 120);
    let targetZoomH = availH * 0.66;
    let targetZoomW = targetZoomH * (16 / 9);
    const maxW = this.width - (this.width <= 640 ? 24 : 110);
    if (targetZoomW > maxW) {
      targetZoomW = maxW;
      targetZoomH = targetZoomW / (16 / 9);
    }
    const zoomWWorld = this.pxToWorld(targetZoomW);
    const zoomHWorld = this.pxToWorld(targetZoomH);
    const shiftYWorld = this.pxToWorld(overviewBandPx * 0.44 + 14);

    // Local coordinates for screen-centered zoomed plane
    this.tmpLocalCenter
      .set(0, shiftYWorld, 2.2)
      .applyQuaternion(this.invSphereQuat);

    for (const entry of this.entries) {
      const baseW = baseSizeWorld;
      const baseH = baseSizeWorld / entry.aspect;

      // Always face the camera
      entry.mesh.quaternion.copy(this.invSphereQuat);

      if (this.zoomedEntry && entry === this.zoomedEntry) {
        this.tmpTargetPos
          .copy(entry.basePos)
          .lerp(this.tmpLocalCenter, expand);
        entry.mesh.position.copy(this.tmpTargetPos);
        entry.mesh.scale.set(
          THREE.MathUtils.lerp(baseW, zoomWWorld, expand),
          THREE.MathUtils.lerp(baseH, zoomHWorld, expand),
          1,
        );
        entry.mesh.material.opacity = 1;
        entry.mesh.renderOrder = 20;
      } else {
        const pushFactor = 1 + 0.8 * expand;
        const posScale = intro * overshoot * pushFactor;
        entry.mesh.position.copy(entry.basePos).multiplyScalar(posScale);

        // Subtle hover lift
        const hoverBoost =
          !this.zoomedEntry && this.hoveredEntry === entry ? 1.12 : 1.0;
        entry.mesh.scale.set(
          baseW * intro * hoverBoost,
          baseH * intro * hoverBoost,
          1,
        );

        // Depth-aware calm opacity for readability and 3D depth cues
        this.tmpDir
          .copy(entry.basePos)
          .applyQuaternion(this.sphereGroup.quaternion);
        const depthFade = THREE.MathUtils.clamp(
          0.35 + ((this.tmpDir.z + 4.5) / 9) * 0.65,
          0.25,
          1,
        );
        entry.mesh.material.opacity =
          THREE.MathUtils.lerp(depthFade, 0.1, expand) * intro;
        entry.mesh.renderOrder = 1;
      }
    }
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
      if (this.disposed || !this.active) {
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
      if (this.disposed || !this.active) return;

      this.updateHoverRaycast();
      this.updateSceneTransforms();
      this.renderer.render(this.scene, this.camera);

      this.frameCount += 1;
      if (this.frameCount <= 20 || this.frameCount % 30 === 0) {
        this.renderer.domElement.dataset.frames = String(this.frameCount);
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
    this.active = false;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.clearInterval(this.videoCheckTimer);
    gsap.killTweensOf(this.animState);

    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    el.removeEventListener('wheel', this.onWheelBound);
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);

    for (const entry of this.entries) {
      entry.video.pause();
      entry.video.removeAttribute('src');
      entry.video.load();
      entry.texture.dispose();
      entry.mesh.material.dispose();
    }
    if (this.entries[0]) {
      this.entries[0].mesh.geometry.dispose();
    }
    this.renderer.dispose();
    if (el.parentElement) {
      el.parentElement.removeChild(el);
    }
  }
}
