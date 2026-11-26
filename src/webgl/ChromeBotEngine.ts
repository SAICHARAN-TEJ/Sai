import * as THREE from 'three';
import gsap from 'gsap';

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

export class ChromeBotEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envTex: THREE.Texture;

  private botRoot: THREE.Group;
  private headGroup: THREE.Group;
  private leftEye: THREE.Mesh;
  private rightEye: THREE.Mesh;
  private halo: THREE.Mesh;
  private pulseRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;

  private isSoftwareGl: boolean;
  private reducedMotion: boolean;
  private width = 1;
  private height = 1;
  private active = true;
  private disposed = false;
  private frameId = 0;
  private frameCount = 0;

  // Motion & personality state
  private targetRotX = -0.18;
  private targetRotY = 0.24;
  private targetRotZ = 0.06;
  private curRotX = -0.18;
  private curRotY = 0.24;
  private curRotZ = 0.06;
  private floatPhase = 0;
  private floatSpeed = 1.0;
  private floatAmp = 1.0;
  private lastInputTime = performance.now();
  private lastFrameTime = performance.now();
  private isSleeping = false;
  private isReacting = false;
  private reactionToggle = false;
  private reactionOffset = { x: 0, y: 0, z: 0 };
  private eyeScaleY = { value: 1 };
  private blinkTimer = 0;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2(99, 99);
  private readonly hitMeshes: THREE.Object3D[] = [];

  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerDownBound: (e: PointerEvent) => void;
  private onActivityBound: () => void;
  private onResizeBound: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion =
      new URLSearchParams(window.location.search).get('autostart') === '1';

    this.width = Math.max(container.clientWidth || window.innerWidth, 1);
    this.height = Math.max(container.clientHeight || window.innerHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x0c0c0d, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.dataset.testid = 'chromebot-canvas';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 11.5);

    // Procedural dark studio light-panel environment (exact KR.ST lighting balance <= 1.1)
    this.envTex = this.createStudioEnvironment();
    this.scene.environment = this.envTex;

    // Subtle cool-indigo rim accent light for metallic depth
    const rimLight = new THREE.DirectionalLight(0x9ca8ff, 0.85);
    rimLight.position.set(-4, 3, -4);
    this.scene.add(rimLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf2, 0.6);
    keyLight.position.set(4, 5, 6);
    this.scene.add(keyLight);

    // Build composite chrome bot
    this.botRoot = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.botRoot.add(this.headGroup);
    this.scene.add(this.botRoot);

    const { leftEye, rightEye, halo } = this.buildBotGeometry();
    this.leftEye = leftEye;
    this.rightEye = rightEye;
    this.halo = halo;

    // Click pulse ring
    const ringGeo = new THREE.RingGeometry(0.84, 1.0, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7a85ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.pulseRing = new THREE.Mesh(ringGeo, ringMat);
    this.pulseRing.position.set(0, 0, -2.5);
    this.pulseRing.scale.setScalar(0.01);
    this.scene.add(this.pulseRing);

    this.updateBotScaleAndPosition();

    // Gentle reveal settle (always unmistakably full-sized from frame 1)
    if (!this.reducedMotion) {
      const targetScale = this.botRoot.scale.x;
      this.botRoot.scale.setScalar(targetScale * 0.86);
      gsap.to(this.botRoot.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.7,
        ease: 'power3.out',
      });
    }

    // Bind events
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onActivityBound = this.registerActivity.bind(this);
    this.onResizeBound = this.handleResize.bind(this);

    window.addEventListener('pointermove', this.onPointerMoveBound, {
      passive: true,
    });
    this.renderer.domElement.addEventListener(
      'pointerdown',
      this.onPointerDownBound,
    );
    window.addEventListener('keydown', this.onActivityBound, { passive: true });
    window.addEventListener('wheel', this.onActivityBound, { passive: true });
    window.addEventListener('resize', this.onResizeBound, { passive: true });

    this.scheduleBlink();
    this.startLoop();
  }

  private createStudioEnvironment(): THREE.Texture {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0a0a0b);

    const addPanel = (
      w: number,
      h: number,
      pos: [number, number, number],
      rot: [number, number, number],
      intensity: number,
      tint = 0xffffff,
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(tint).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
      envScene.add(mesh);
    };

    // Soft studio softboxes matching KR.ST panel intensities
    addPanel(14, 5, [0, 6, 0], [Math.PI / 2, 0, 0], 1.1);
    addPanel(3.2, 10, [-6, 0, 0], [0, Math.PI / 2, 0], 1.0, 0xf2f4ff);
    addPanel(2.4, 10, [6, 0, 0], [0, -Math.PI / 2, 0], 0.85, 0xfff7ec);
    addPanel(12, 2.2, [0, -1.5, -6], [0, 0, 0], 0.65, 0xd8dcff);
    addPanel(5, 4, [3, 2.5, 6], [0, Math.PI, 0], 0.82);
    addPanel(14, 6, [0, -6, 0], [-Math.PI / 2, 0, 0], 0.24);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();

    // Cleanup temporary env meshes
    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    return rt.texture;
  }

  private buildBotGeometry(): {
    leftEye: THREE.Mesh;
    rightEye: THREE.Mesh;
    halo: THREE.Mesh;
  } {
    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.07,
      envMapIntensity: 1.05,
    });

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x050507,
      metalness: 0.3,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.1,
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xf4f3ee,
    });

    // 1. Sculpted chrome head
    const headGeo = new THREE.SphereGeometry(1, 48, 40);
    const headMesh = new THREE.Mesh(headGeo, chromeMat);
    headMesh.scale.set(1.1, 1.0, 0.98);
    this.headGroup.add(headMesh);
    this.hitMeshes.push(headMesh);

    // 2. Curved glossy dark visor patch
    const visorGeo = new THREE.SphereGeometry(
      1,
      40,
      28,
      Math.PI * 0.5 - 1.02,
      2.04,
      Math.PI * 0.5 - 0.48,
      0.96,
    );
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.scale.set(1.1 * 1.016, 1.0 * 1.016, 0.98 * 1.016);
    this.headGroup.add(visorMesh);
    this.hitMeshes.push(visorMesh);

    // 3. Expressive warm-white capsule eyes resting cleanly on the visor curve
    const eyeGeo = new THREE.CapsuleGeometry(0.072, 0.19, 8, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 0.04, 0.965);
    leftEye.rotation.y = -0.24;
    leftEye.scale.set(1, 1, 0.45);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.3, 0.04, 0.965);
    rightEye.rotation.y = 0.24;
    rightEye.scale.set(1, 1, 0.45);
    this.headGroup.add(rightEye);

    // 4. Chrome antenna stem + sphere tip
    const stemGeo = new THREE.CylinderGeometry(0.022, 0.032, 0.42, 16);
    const stemMesh = new THREE.Mesh(stemGeo, chromeMat);
    stemMesh.position.set(0, 1.16, 0);
    this.headGroup.add(stemMesh);

    const tipGeo = new THREE.SphereGeometry(0.095, 24, 20);
    const tipMesh = new THREE.Mesh(tipGeo, chromeMat);
    tipMesh.position.set(0, 1.39, 0);
    this.headGroup.add(tipMesh);

    // 5. Chrome torus ears with glossy visor caps
    const earGeo = new THREE.TorusGeometry(0.2, 0.064, 20, 40);
    const capGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 24);

    const leftEar = new THREE.Mesh(earGeo, chromeMat);
    leftEar.position.set(-1.1, 0, 0);
    leftEar.rotation.y = Math.PI / 2;
    this.headGroup.add(leftEar);

    const leftCap = new THREE.Mesh(capGeo, visorMat);
    leftCap.position.set(-1.12, 0, 0);
    leftCap.rotation.z = Math.PI / 2;
    this.headGroup.add(leftCap);

    const rightEar = new THREE.Mesh(earGeo, chromeMat);
    rightEar.position.set(1.1, 0, 0);
    rightEar.rotation.y = Math.PI / 2;
    this.headGroup.add(rightEar);

    const rightCap = new THREE.Mesh(capGeo, visorMat);
    rightCap.position.set(1.12, 0, 0);
    rightCap.rotation.z = Math.PI / 2;
    this.headGroup.add(rightCap);

    // 6. Tilted floating chrome halo underneath
    const haloGeo = new THREE.TorusGeometry(0.78, 0.048, 20, 72);
    const halo = new THREE.Mesh(haloGeo, chromeMat);
    halo.position.set(0, -1.26, 0);
    halo.rotation.x = THREE.MathUtils.degToRad(82.8);
    this.botRoot.add(halo);

    return { leftEye, rightEye, halo };
  }

  private updateBotScaleAndPosition(): void {
    const visibleHeight =
      2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(22.5));
    const desiredPx =
      this.width <= 640 ? 156 : this.width <= 1024 ? 176 : 206;
    const worldHeight = (desiredPx * visibleHeight) / Math.max(this.height, 1);
    // Bot bounding height is roughly 2.85 units
    const s = worldHeight / 2.85;
    this.botRoot.scale.setScalar(s);
    // Keep bot poised slightly above center so headline & cards breathe cleanly
    const yOffset = this.width <= 640 ? 0.55 : 0.18;
    this.botRoot.position.set(0, yOffset, 0);
    this.pulseRing.position.set(0, yOffset, -2.0);
  }

  private scheduleBlink(): void {
    if (this.disposed) return;
    const delay = 2800 + Math.random() * 2400;
    this.blinkTimer = window.setTimeout(() => {
      if (!this.disposed && this.active && !this.isSleeping && !this.isReacting) {
        gsap.to(this.eyeScaleY, {
          value: 0.1,
          duration: 0.11,
          ease: 'power2.in',
          onComplete: () => {
            gsap.to(this.eyeScaleY, {
              value: 1,
              duration: 0.14,
              ease: 'power2.out',
            });
          },
        });
      }
      this.scheduleBlink();
    }, delay);
  }

  private registerActivity(): void {
    this.lastInputTime = performance.now();
    if (this.isSleeping) {
      this.wakeUp();
    }
  }

  private enterSleep(): void {
    this.isSleeping = true;
    gsap.to(this.eyeScaleY, { value: 0.18, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(this, {
      floatSpeed: 0.35,
      floatAmp: 1.45,
      duration: 1.5,
      ease: 'power2.inOut',
    });
  }

  private wakeUp(): void {
    this.isSleeping = false;
    gsap.to(this.eyeScaleY, { value: 1, duration: 0.2, ease: 'power2.out' });
    gsap.to(this, {
      floatSpeed: 1.0,
      floatAmp: 1.0,
      duration: 0.8,
      ease: 'power2.out',
    });
    this.playHeadShake();
  }

  private playHeadShake(): void {
    const tl = gsap.timeline();
    tl.to(this.reactionOffset, { y: 0.22, duration: 0.09, ease: 'power2.out' })
      .to(this.reactionOffset, { y: -0.18, duration: 0.12, ease: 'power2.inOut' })
      .to(this.reactionOffset, { y: 0.1, duration: 0.11, ease: 'power2.inOut' })
      .to(this.reactionOffset, { y: 0, duration: 0.18, ease: 'power2.out' });
  }

  public triggerInteractionBurst(): void {
    if (this.isReacting || this.disposed) return;
    this.registerActivity();
    this.isReacting = true;
    this.reactionToggle = !this.reactionToggle;

    // Expanding luminous lens pulse
    gsap.killTweensOf(this.pulseRing.scale);
    gsap.killTweensOf(this.pulseRing.material);
    this.pulseRing.scale.setScalar(0.1);
    this.pulseRing.material.opacity = 0.68;
    gsap.to(this.pulseRing.scale, {
      x: 7.5,
      y: 7.5,
      z: 1,
      duration: 1.6,
      ease: 'expo.out',
    });
    gsap.to(this.pulseRing.material, {
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out',
    });

    if (this.reactionToggle) {
      // Playful recoil + blink
      gsap.to(this.eyeScaleY, { value: 0.12, duration: 0.12 });
      const tl = gsap.timeline({
        onComplete: () => {
          this.isReacting = false;
          this.playHeadShake();
        },
      });
      tl.to(this.reactionOffset, {
        x: -0.45,
        y: 0.18,
        duration: 0.16,
        ease: 'power3.out',
      }).to(this.reactionOffset, {
        x: 0,
        y: 0,
        duration: 0.85,
        ease: 'elastic.out(1, 0.45)',
        onStart: () => {
          gsap.to(this.eyeScaleY, { value: 1, duration: 0.22 });
        },
      });
    } else {
      // Full 360 spin + subtle z-wobble
      const tl = gsap.timeline({
        onComplete: () => {
          this.reactionOffset.y = 0;
          this.isReacting = false;
          this.playHeadShake();
        },
      });
      tl.to(
        this.reactionOffset,
        {
          y: Math.PI * 2,
          duration: 1.05,
          ease: 'power3.inOut',
        },
        0,
      )
        .to(
          this.reactionOffset,
          { z: 0.24, duration: 0.28, ease: 'power2.out' },
          0,
        )
        .to(
          this.reactionOffset,
          { z: 0, duration: 0.72, ease: 'elastic.out(1, 0.5)' },
          0.28,
        );
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.active) return;
    this.registerActivity();
    const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;

    this.targetRotX = THREE.MathUtils.clamp(ny * 0.58, -0.62, 0.62);
    this.targetRotY = THREE.MathUtils.clamp(nx * 0.56, -0.59, 0.59);
    this.targetRotZ = nx * 0.14;

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.pointerNdc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      const hit = this.raycaster.intersectObjects(this.hitMeshes, false).length > 0;
      this.renderer.domElement.style.cursor = hit ? 'pointer' : 'default';
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.active) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerNdc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    if (this.raycaster.intersectObjects(this.hitMeshes, false).length > 0) {
      this.triggerInteractionBurst();
    }
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
    this.updateBotScaleAndPosition();
  }

  public setActive(active: boolean): void {
    if (this.active === active || this.disposed) return;
    this.active = active;
    if (!active) {
      window.cancelAnimationFrame(this.frameId);
      window.clearTimeout(this.frameId);
    } else {
      this.lastFrameTime = performance.now();
      this.startLoop();
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

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
      this.lastFrameTime = now;

      if (
        !this.isSleeping &&
        !this.reducedMotion &&
        window.innerWidth > 768 &&
        now - this.lastInputTime > 30000
      ) {
        this.enterSleep();
      }

      const ease = 1 - Math.pow(1 - 0.08, 60 * dt);
      const goalX = this.isSleeping ? 0.42 : this.targetRotX;
      const goalY = this.isSleeping ? 0 : this.targetRotY;
      const goalZ = this.isSleeping ? 0.12 : this.targetRotZ;

      this.curRotX += (goalX - this.curRotX) * ease;
      this.curRotY += (goalY - this.curRotY) * ease;
      this.curRotZ += (goalZ - this.curRotZ) * ease;

      this.headGroup.rotation.set(
        this.curRotX + this.reactionOffset.x,
        this.curRotY + this.reactionOffset.y,
        this.curRotZ + this.reactionOffset.z,
      );

      if (!this.reducedMotion) {
        this.floatPhase += dt * 1.5 * this.floatSpeed;
        const baseY = this.width <= 640 ? 0.55 : 0.18;
        this.botRoot.position.y =
          baseY + Math.sin(this.floatPhase) * 0.16 * this.floatAmp;
        this.halo.rotation.z += dt * 0.35;
      }

      this.leftEye.scale.y = this.eyeScaleY.value;
      this.rightEye.scale.y = this.eyeScaleY.value;

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
    window.clearTimeout(this.blinkTimer);

    window.removeEventListener('pointermove', this.onPointerMoveBound);
    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.onPointerDownBound,
    );
    window.removeEventListener('keydown', this.onActivityBound);
    window.removeEventListener('wheel', this.onActivityBound);
    window.removeEventListener('resize', this.onResizeBound);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.envTex.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }
  }
}
