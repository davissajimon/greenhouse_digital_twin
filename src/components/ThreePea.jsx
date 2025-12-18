import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';

export function ThreePea({ temperature = 25 }) {
    // Pea-specific model
    const { scene } = useGLTF('/pea.glb');

    useEffect(() => {
        const temp = Number(temperature);

        // --- DEFINING STATES BY TEMPERATURE ONLY (Pea specific ranges - cool crop) ---

        // 1. FROST (Dead)
        // Range: <= -5°C
        const isFrost = temp <= -5;

        // 2. COLD / WET MODE
        // Range: -5°C < Temp < 5°C (Pea is cold-tolerant but not frost-hardy)
        const isColdWetMode = (temp > -5) && (temp < 5);

        // 3. HOT / DRY MODE
        // Range: Temp > 28°C (Peas prefer cooler conditions, heat stress starts earlier)
        const isHotDryMode = temp > 28;

        // 4. OPTIMAL (Healthy)
        // Range: 5°C <= Temp <= 28°C

        scene.traverse((child) => {
            if (child.isMesh) {
                // Clone material to ensure unique instances
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves') || name.includes('pea');
                const isPod = name.includes('pod') || name.includes('fruit');
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // Reset Defaults
                child.visible = true;
                child.material.roughness = 0.5;
                child.material.metalness = 0.0;

                // --- APPLY VISUALS ---

                // CASE 1: FROST
                if (isFrost) {
                    if (isLeaf || isPod) child.visible = false;
                }

                // CASE 2: HOT / DRY (Temp > 28)
                else if (isHotDryMode) {
                    if (isLeaf) {
                        child.material.color.set('#8B5A2B'); // Brown/Crispy
                        child.material.roughness = 0.5; 
                    } else if (isStem) {
                        child.material.color.set('#5C4033'); // Dry Wood
                    } else if (isPod) {
                        child.visible = false;
                    }
                }

                // CASE 3: COLD / WET (Temp < 5)
                else if (isColdWetMode) {
                    if (isLeaf) {
                        child.material.color.set('#708270'); // Greyish-Green (Moldy)
                        child.material.roughness = 0.5;
                    } else if (isStem) {
                        child.material.color.set('#4A5D4A'); // Rotting Stem
                    } else if (isPod) {
                        child.material.color.set('#556B2F'); // Rotting Dark Green
                        child.material.roughness = 0.5;
                    }
                }

                // CASE 4: OPTIMAL (5 <= Temp <= 28)
                else {
                    if (isLeaf) {
                        child.material.color.set('#2E8B57'); // Healthy Green
                    } else if (isStem) {
                        child.material.color.set('#3A5F0B'); // Healthy Stem
                    } else if (isPod) {
                        child.material.color.set('#6B8E23'); // Olive Green Pea Pod
                        child.material.roughness = 0.4;
                        child.material.metalness = 0.05; 
                    }
                }

                // Always color Pot
                if (isPot) {
                    child.material.color.set('#8B4513');
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

useGLTF.preload('/pea.glb');
