import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

export function ThreeTomato({ data }) {
    const { scene } = useGLTF('/Untitled.glb');

    useEffect(() => {
        // Evaluate condition based on full sensor data
        // Check if data exists, if not use default safely
        const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
        const healthState = evaluatePlantHealth(safeData);
        const condition = healthState.id;

        scene.traverse((child) => {
            if (child.isMesh) {
                // Ensure unique material
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                    // Backup original color if needed, simplified here by hardcoding defaults
                }

                // Identify Parts
                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isFruit = name.includes('tomato');
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // --- RESET TO HEALTHY DEFAULT ---
                child.visible = true;
                if (isLeaf) {
                    child.material.color.set('#2E8B57'); // Healthy Leaf Green
                    child.material.emissive.setHex(0x000000);
                    child.material.roughness = 0.5;
                }
                if (isStem) child.material.color.set('#3A5F0B');
                if (isFruit) {
                    child.material.color.set('#c61b1b'); // Red
                    child.material.roughness = 0.2;
                }
                if (isPot) child.material.color.set('#8B4513');


                // --- APPLY CONDITION VISUALS ---

                switch (condition) {
                    case CONDITIONS.FROST:
                        // Blue tint + slight emissive glow (frozen)
                        if (isLeaf || isStem) {
                            child.material.color.lerp({ r: 0.5, g: 0.7, b: 1 }, 0.6); // Icy Blue mix
                            child.material.roughness = 0.2; // Shiny ice
                            child.material.emissive.setHex(0x001133);
                        }
                        if (isFruit) child.visible = false; // Fruit drop/hidden in frost
                        break;

                    case CONDITIONS.HEAT_STRESS:
                        // Yellow/Brown scorching
                        if (isLeaf) {
                            child.material.color.set('#e6b800'); // Yellowish
                            child.material.roughness = 0.8; // Dry
                        }
                        break;

                    case CONDITIONS.DROUGHT:
                        // Brown + Dull
                        if (isLeaf) {
                            child.material.color.set('#8B7355'); // Dried Earth Color
                            child.material.roughness = 1.0;
                        }
                        break;

                    case CONDITIONS.ROOT_ROT:
                        // Dark stem, sickly leaves
                        if (isStem) child.material.color.set('#2F1B10'); // Dark Brown/Black
                        if (isLeaf) child.material.color.set('#556B2F'); // Olive Drab (Sick)
                        break;

                    case CONDITIONS.MOLD_RISK:
                    case CONDITIONS.DISEASE_ZONE:
                        // White/Grayish spotting (simulated by color wash)
                        if (isLeaf) {
                            child.material.color.set('#778877'); // Moldy Gray Green
                            child.material.roughness = 0.9;
                        }
                        break;

                    case CONDITIONS.SUNSCALD:
                        if (isLeaf || isFruit) {
                            child.material.color.lerp({ r: 1, g: 1, b: 0.8 }, 0.5); // Bleached
                        }
                        break;

                    case CONDITIONS.BLOSSOM_DROP:
                        // Logic handled by hiding fruit usually, assuming fruit = blossom stage in this simplified model
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.WILTING_WET:
                        // High heat + water logging = Boiled / collapsed
                        if (isLeaf) {
                            child.material.color.set('#4B5320'); // Army Green (Wilting)
                            child.material.roughness = 0.9;
                        }
                        if (isStem) child.material.color.set('#4A4A4A');
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.SLOW_GROWTH:
                        // Pale / Stunted
                        if (isLeaf) child.material.color.set('#9ACD32'); // YellowGreen
                        break;

                    default:
                        // Normal is handled by reset
                        break;
                }
            }
        });
    }, [scene, data]);

    return (
        <group dispose={null}>
            <Center top>
                <group scale={0.5} position={[0, 0, -5]}>
                    <primitive object={scene} />
                </group>
            </Center>
        </group>
    );
}
