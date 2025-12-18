import React, { useEffect } from "react";
import { useGLTF, Center } from "@react-three/drei";

export function ThreeChilli({ temperature = 25 }) {
  // Chilli-specific model
  const { scene } = useGLTF("/chilli.glb");

  useEffect(() => {
    const temp = Number(temperature);

    // --- DEFINING STATES BY TEMPERATURE ONLY (Chilli specific ranges) ---

    // 1. FROST (Dead)
    // Range: <= 0°C
    const isFrost = temp <= 0;

    // 2. COLD / WET MODE
    // Range: 0°C < Temp < 15°C (Chilli is more cold-sensitive)
    const isColdWetMode = temp > 0 && temp < 15;

    // 3. HOT / DRY MODE
    // Range: Temp > 40°C (Chilli tolerates higher heat)
    const isHotDryMode = temp > 40;

    // 4. OPTIMAL (Healthy)
    // Range: 15°C <= Temp <= 40°C

    scene.traverse((child) => {
      if (child.isMesh) {
        // Clone material to ensure unique instances
        if (!child.userData.isCloned) {
          child.material = child.material.clone();
          child.userData.isCloned = true;
        }

        const name = child.name ? child.name.toLowerCase() : "";
        const isLeaf = name.includes("leaf") || name.includes("leaves");
        const isFruit = name.includes("chilli");
        const isStem = name.includes("stem");
        const isPot = name.includes("pot");

        // Reset Defaults
        child.visible = true;
        child.material.roughness = 0.3;
        child.material.metalness = 0.0;

        // --- APPLY VISUALS ---

        // CASE 1: FROST
        if (isFrost) {
          if (isLeaf || isFruit) child.visible = false;
          if (isStem) {
            child.material = child.material.clone();

            // Disconnect the texture map so the color shows pure
            child.material.map = null;
            child.material.color.set("#0f736f");

            // Important: Tell Three.js the material needs a re-compile
            child.material.needsUpdate = true;
          }
        }

        // CASE 2: HOT / DRY (Temp > 40)
        else if (isHotDryMode) {
          if (isLeaf) {
            child.material.color.set("#3f1e1e"); // Brown/Crispy
            child.material.roughness = 0.8;
          } else if (isStem) {
            child.material.color.set("#774313");
            child.material.roughness = 0.9; // Dry Wood
          } else if (isFruit) {
            child.visible = false;
          }
        }

        // CASE 3: COLD / WET (Temp < 15)
         else if (isColdWetMode) {
    

    
    child.material.map = null; 
    
   
    child.material.needsUpdate = true; 

    if (isLeaf) {
        child.material.color.set("#89be26"); // Greyish-Green (Moldy)
        child.material.roughness = 0.5; // Slightly wet
    } else if (isStem) {
        child.material.color.set("#02527e"); // Rotting Stem
        // Stems usually don't need roughness changes, but you can add if it looks too shiny
    } else if (isFruit) {
        child.material.color.set("#A52A2A"); // Deep Rotten Red
        child.material.roughness = 0.2; // Rotting fruit is often slimy/wet (low roughness)
    }
}

        // CASE 4: OPTIMAL (15 <= Temp <= 40)
      
else{
    if (isLeaf) {
        child.material.color.set("#135a1a"); // Greyish-Green (Moldy)
        child.material.roughness = 0.9;
    }
    if (isStem)
    {
         child.material.color.set("#06370b"); // Greyish-Green (Moldy)
        child.material.roughness = 0.9;
    }
    if(isFruit)
    {
        child.material.color.set("#b01010ff")
    }
}
        // Always color Pot
        if (isPot) {
          child.material.color.set("#8B4513");
        }
      }
    });
  }, [scene, temperature]);

  return (
    <group dispose={null}>
      <Center top>
        <group scale={0.35} position={[0, -4, 1.5]}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  );
}

useGLTF.preload("/chilli.glb");
