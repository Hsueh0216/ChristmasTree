import * as THREE from 'three';

export const COLORS = {
  EMERALD_DEEP: "#002816",
  EMERALD_LITE: "#004225",
  GOLD_METALLIC: "#FFD700",
  GOLD_PALE: "#F5E6BF",
  RED_VELVET: "#580b0b",
  ACCENT_GLOW: "#ffeebb",
};

export const CONFIG = {
  FOLIAGE_COUNT: 900,
  ORNAMENT_COUNT: 400,
  GIFT_COUNT: 12,
  TREE_HEIGHT: 12,
  TREE_RADIUS: 4.5,
  SCATTER_RADIUS: 25,
};

// Helper to generate random point in sphere
export const getRandomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper to generate point on a cone surface (Tree shape)
export const getConePoint = (height: number, maxRadius: number, yOffset: number = -height / 2): THREE.Vector3 => {
  const y = Math.random() * height; // Height from bottom
  const rAtY = (maxRadius * (height - y)) / height; // Radius decreases as we go up
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * rAtY; // Uniform distribution on disk at height y

  // Add spiral bias for elegance
  const spiral = y * 0.5; 
  
  return new THREE.Vector3(
    r * Math.cos(theta + spiral),
    y + yOffset,
    r * Math.sin(theta + spiral)
  );
};

// Helper to generate point on a disk (Base for gifts)
export const getDiskPoint = (innerRadius: number, outerRadius: number, y: number): THREE.Vector3 => {
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random() * (outerRadius**2 - innerRadius**2) + innerRadius**2);
  return new THREE.Vector3(
    r * Math.cos(theta),
    y,
    r * Math.sin(theta)
  );
};