import React, { useEffect } from "react";
import { useGLTF, Center } from "@react-three/drei";
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

export function ThreeChilli({ data }) {
  const { scene } = useGLTF("/chilli_v2.glb");

  useEffect(() => {
    // Safety check
    const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
    const healthState = evaluatePlantHealth(safeData);
    const condition = healthState.id;

    scene.traverse((child) => {
      if (child.isMesh) {
        if (!child.userData.isCloned) {
          child.material = child.material.clone();
          child.userData.isCloned = true;
        }

        const name = child.name ? child.name.toLowerCase() : "";
        const isLeaf = name.includes("leaf") || name.includes("leaves");
        const isFruit = name.includes("chilli");
        const isStem = name.includes("stem");
        const isPot = name.includes("pot");

        // --- RESET DEFAULTS ---
        child.visible = true;
        child.material.emissive.setHex(0x000000);
        child.material.roughness = 0.3;
        child.material.metalness = 0.0;

        // Chilli Default Colors
        if (isLeaf) child.material.color.set("#135a1a");
        if (isStem) child.material.color.set("#06370b");
        if (isFruit) child.material.color.set("#b01010");
        if (isPot) child.material.color.set("#8B4513");


        // --- APPLY CONDITIONS ---
        switch (condition) {
          case CONDITIONS.FROST:
            if (isLeaf || isStem) {
              child.material.color.lerp({ r: 0.6, g: 0.8, b: 1 }, 0.7);
              child.material.emissive.setHex(0x002244);
            }
            if (isFruit) child.visible = false;
            break;

          case CONDITIONS.HEAT_STRESS:
            if (isLeaf) {
              child.material.color.set("#3f1e1e"); // Brownish Red
              child.material.roughness = 0.8;
            }
            break;

          case CONDITIONS.DROUGHT:
            if (isLeaf) {
              child.material.color.set("#8B4513"); // Brown
              child.material.roughness = 0.9;
            }
            break;

          case CONDITIONS.ROOT_ROT:
            if (isStem) child.material.color.set("#1a0d00");
            if (isLeaf) child.material.color.set("#5c715c");
            break;

          case CONDITIONS.MOLD_RISK:
          case CONDITIONS.DISEASE_ZONE:
            if (isLeaf) {
              child.material.color.set("#8FBC8F"); // Moldy pale green
              child.material.roughness = 1.0;
            }
            break;

          case CONDITIONS.SUNSCALD:
            if (isLeaf || isFruit) child.material.color.lerp({ r: 1, g: 1, b: 0.9 }, 0.4);
            break;

          case CONDITIONS.WILTING_WET:
            if (isLeaf) child.material.color.set('#4B5320'); // Dark Army Green
            if (isFruit) child.visible = false;
            break;

          case CONDITIONS.SLOW_GROWTH:
            if (isLeaf) child.material.color.set('#6B8E23');
            break;

          default:
            break;
        }
      }
    });
  }, [scene, data]);

  return (
    <group dispose={null}>
      <Center top>
        <group scale={1.3} position={[0, -3.75, 1.5]}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  );
}
