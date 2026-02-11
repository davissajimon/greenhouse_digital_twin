import React, { useEffect, useMemo } from "react";
import { useGLTF, Center } from "@react-three/drei";
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

// Preload for better performance
useGLTF.preload("/chilli_v2.glb");

export function ThreeChilli({ data, onLoad }) {
  const { scene } = useGLTF("/chilli_v2.glb");
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (onLoad) onLoad();
  }, [onLoad]);

  const healthState = useMemo(() => {
    const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
    return evaluatePlantHealth(safeData);
  }, [data]);

  useEffect(() => {
    const condition = healthState.id;

    clone.traverse((child) => {
      if (child.isMesh) {
        if (!child.userData.isCloned) {
          child.material = child.material.clone();
          child.userData.isCloned = true;
        }

        const name = child.name ? child.name.toLowerCase() : "";
        const isLeaf = name.includes("leaf") || name.includes("leaves");
        const isFruit = name.includes("chilli"); // chilli fruit
        const isStem = name.includes("stem");
        const isPot = name.includes("pot");

        // --- RESET DEFAULTS ---
        child.visible = true;
        child.material.emissive.setHex(0x000000);
        child.material.roughness = 0.3;
        child.material.metalness = 0.0;
        child.material.transparent = false;
        child.material.opacity = 1.0;

        // Chilli Default Colors
        if (isLeaf) child.material.color.set("#135a1a");
        if (isStem) child.material.color.set("#06370b");
        if (isFruit) child.material.color.set("#b01010"); // Red chilli
        if (isPot) child.material.color.set("#8B4513");


        // --- APPLY CONDITIONS ---
        switch (condition) {
          case CONDITIONS.FROST:
            // Blue tint + slight emissive glow (frozen)
            if (isLeaf || isStem) {
              child.material.color.lerp({ r: 0.5, g: 0.7, b: 1 }, 0.6); // Icy Blue mix
              child.material.roughness = 0.2; // Shiny ice
              child.material.emissive.setHex(0x001133);
            }
            // Frost damage: hide ALL leaves
            if (isLeaf) {
              child.visible = false;
            }
            if (isFruit) child.visible = false;
            break;

          case CONDITIONS.COLD_STRESS:
            // Deep Cold: Hide all leaves and fruit (severe damage/stunted)
            if (isLeaf) child.visible = false;
            if (isFruit) child.visible = false;
            break;

          case CONDITIONS.HEAT_STRESS:
            if (isLeaf) {
              child.material.color.set("#3f1e1e"); // Brownish Red / Scorch
              child.material.roughness = 0.9;
            }
            break;

          case CONDITIONS.DROUGHT:
            if (isLeaf) {
              child.material.color.set("#8B4513"); // Brown
              child.material.roughness = 1.0;
            }
            if (isFruit) {
              child.material.color.set('#5c4033'); // Dried fruit
              child.material.roughness = 1.0;
            }
            break;

          case CONDITIONS.ROOT_COLD_STRESS:
            if (isStem) {
              child.material.color.set('#88B0C8'); // Icy/Steel Blue Stem
            }
            if (isLeaf) {
              child.material.color.set('#2F4F4F'); // Cold dark green
            }
            break;

          case CONDITIONS.ROOT_HEAT_STRESS:
            if (isLeaf) child.material.color.set('#CD5C5C'); // Reddish
            if (isStem) child.material.color.set('#8B0000'); // Dark Red
            if (isFruit) child.material.color.set('#FF4500'); // Orange Red
            break;

          case CONDITIONS.ROOT_ROT: // Note: Not in basic conditions list but kept if used logically elsewhere, else map to Waterlogging usually. 
            // PlantHealthEngine doesn't emit ROOT_ROT, it emits WATERLOGGING. But if it did:
            if (isStem) child.material.color.set("#1a0d00");
            if (isLeaf) child.material.color.set("#5c715c");
            break;

          case CONDITIONS.HIGH_HUMIDITY:
          case CONDITIONS.MOLD_RISK:
          case CONDITIONS.DISEASE_ZONE: // Fallback for old codes
            if (isLeaf) {
              child.material.color.set("#8FBC8F"); // Moldy pale green
              child.material.roughness = 1.0;
              child.material.transparent = true;
              child.material.opacity = 0.8;
            }
            if (isFruit) {
              child.material.color.set('#8B4500'); // Dull
            }
            break;

          case CONDITIONS.SUNSCALD:
            // Not in engine but kept for completeness
            if (isLeaf || isFruit) child.material.color.lerp({ r: 1, g: 1, b: 0.9 }, 0.4);
            break;

          case CONDITIONS.FLOWER_DROP:
            if (isFruit) child.visible = false;
            if (isLeaf) child.material.color.set('#556B2F'); // Dull
            break;

          case CONDITIONS.WATERLOGGING:
          case CONDITIONS.WILTING_WET:
            if (isLeaf) {
              child.material.color.set('#F0E68C'); // Khaki/Pale
              child.material.transparent = true;
              child.material.opacity = 0.8;
              // Simulate lower leaves dropping if possible using uuid/name hash
              if (child.uuid.charCodeAt(0) % 5 < 3) {
                child.visible = false;
              }
            }
            if (isFruit) child.visible = false;
            if (isStem) child.material.color.set('#2F4F4F'); // Dark wet
            break;

          case CONDITIONS.SLOW_GROWTH:
            if (isLeaf) child.material.color.set('#6B8E23');
            break;

          default:
            break;
        }
      }
    });
  }, [clone, healthState]);

  return (
    <group>
      <Center top>
        <group scale={healthState.id === CONDITIONS.COLD_STRESS ? 1.0 : 1.3} position={[0, -3.75, 1.5]}>
          <primitive object={clone} />
        </group>
      </Center>
    </group>
  );
}
