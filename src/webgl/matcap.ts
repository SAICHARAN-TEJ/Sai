import * as THREE from 'three';

/**
 * Generates a 64x64 procedural soft grey spherical matcap texture
 * and its embedded PNG data URI (zero external fetches).
 */
export function createMatcapTexture(): {
  texture: THREE.CanvasTexture;
  dataUri: string;
} {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    const cx = size * 0.5;
    const cy = size * 0.5;
    const radius = size * 0.48;

    // Soft spherical base shading offset slightly upper-left for studio depth
    const grad = ctx.createRadialGradient(
      size * 0.38,
      size * 0.34,
      size * 0.04,
      cx,
      cy,
      radius,
    );
    grad.addColorStop(0.0, '#f4f4f6');
    grad.addColorStop(0.28, '#c6c6ce');
    grad.addColorStop(0.62, '#6c6c75');
    grad.addColorStop(0.88, '#28282e');
    grad.addColorStop(1.0, '#09090b');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle secondary rim bounce on lower-right limb
    const rim = ctx.createRadialGradient(
      size * 0.68,
      size * 0.7,
      size * 0.02,
      cx,
      cy,
      radius,
    );
    rim.addColorStop(0.0, 'rgba(180, 172, 210, 0.28)');
    rim.addColorStop(0.5, 'rgba(120, 120, 130, 0.06)');
    rim.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();
  }

  const dataUri = canvas.toDataURL('image/png');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return { texture, dataUri };
}
