import React, { useEffect, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';

export function ThreeTomato({ healthStatus, temperature = 25 }) {
    const { scene } = useGLTF('/Untitled.glb');
    const isInitialized = useRef(false);

    useEffect(() => {
        // Ensure temperature is a number
        const temp = Number(temperature);

        scene.traverse((child) => {
            if (child.isMesh) {
                // PERF: Only clone materials once to avoid memory leaks/overhead
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isTomato = name.includes('tomato');

                // --- REALISM: FROSTBITE MESH LOSS ---
                // If frostbitten (<= 0), leaves and tomatoes fall off (hide them).
                if (temp <= 0 && (isLeaf || isTomato)) {
                    child.visible = false;
                    return; // Skip coloring if hidden
                } else {
                    child.visible = true;
                }

                // --- 5-STAGE COLOR CHART (Refined for visibility) ---
                let leafHex = '#2E8B57';   // Healthy (Green)
                let stemHex = '#3A5F0B';   // Healthy (Green)
                let tomatoHex = '#C71F1F'; // Healthy (Red)

                // 3. FROSTBITE (<= 0°C) - (Meshes hidden above, but color logic kept for safety/reference)
                if (temp <= 0) {
                    // (Hidden)
                }
                // 2. CHILLING (< 10°C)
                else if (temp < 10) {
                    leafHex = '#1F5F3B';   // Dark Green
                    stemHex = '#5A3D6A';   // Purple Tint
                    tomatoHex = '#8F9C6B'; // Dull Green/Red
                }
                // 5. HEAT STROKE (> 40°C)
                else if (temp > 40) {
                    leafHex = '#5C3A21';   // Burnt Brown
                    stemHex = '#5C4033';   // Dry Wood
                    tomatoHex = '#E6CCAA'; // Pale Bleached
                }
                // 4. HEAT STRESS (> 30°C)
                else if (temp > 30) {
                    leafHex = '#A9C52F';   // Yellowing
                    stemHex = '#5C7A32';   // Faded
                    tomatoHex = '#D1423F'; // Stressed Red
                }

                // --- APPLY COLORS ---

                // POT
                if (name.includes('pot')) {
                    child.material.color.set('#8B4513');
                }
                // STEM
                else if (name.includes('stem')) {
                    child.material.color.set(stemHex);
                }
                // LEAVES
                else if (name.includes('leaf') || name.includes('leaves')) {
                    child.material.color.set(leafHex);
                }
                // TOMATOES
                else if (name.includes('tomato')) {
                    child.material.color.set(tomatoHex);

                    // Texture adjustments
                    if (temp <= 0) {
                        child.material.roughness = 1.0; // Very rough (rotten)
                        child.material.metalness = 0.0;
                    } else if (temp > 40) {
                        child.material.roughness = 1.0; // Dry
                    } else {
                        child.material.roughness = 0.2; // Shiny
                        child.material.metalness = 0.1;
                    }
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

useGLTF.preload('/Untitled.glb');
