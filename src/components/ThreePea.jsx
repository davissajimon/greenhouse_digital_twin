import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { evaluatePlantHealth, CONDITIONS } from '../utils/PlantHealthEngine';

export function ThreePea({ data }) {
    // Currently using healthy_tomato as placeholder per previous context
    const { scene } = useGLTF('/healthy_tomato.glb');

    useEffect(() => {
        const safeData = data || { temperature: 25, humidity: 60, soil_moisture: 50 };
        const healthState = evaluatePlantHealth(safeData);
        const condition = healthState.id;

        scene.traverse((child) => {
            if (child.isMesh) {
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isFruit = name.includes('tomato'); // Placeholder has tomato parts
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // --- RESET DEFAULTS ---
                child.visible = true;
                child.material.emissive.setHex(0x000000);
                child.material.roughness = 0.5;

                // Pea Base Colors (Slightly lighter/yellower green than tomato)
                if (isLeaf) child.material.color.set('#66CDAA');
                if (isStem) child.material.color.set('#556B2F');
                // Pea flowers/pods are usually green/white, but placeholder is tomato fruit
                if (isFruit) child.material.color.set('#98FB98'); // Pale Green for "Pea Pods"
                if (isPot) child.material.color.set('#8B4513');


                // --- APPLY CONDITIONS ---
                switch (condition) {
                    case CONDITIONS.FROST:
                        if (isLeaf || isStem) {
                            child.material.color.lerp({ r: 0.7, g: 0.8, b: 1 }, 0.6);
                            child.material.emissive.setHex(0x001133);
                        }
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.HEAT_STRESS:
                        if (isLeaf) {
                            child.material.color.set('#BDB76B'); // Khaki (Dry)
                            child.material.roughness = 0.8;
                        }
                        break;

                    case CONDITIONS.DROUGHT:
                        if (isLeaf) {
                            child.material.color.set('#8B7355');
                            child.material.roughness = 1.0;
                            // Rotate leaves down could be added here if referencing specific mesh
                        }
                        break;

                    case CONDITIONS.ROOT_ROT:
                        if (isStem) child.material.color.set('#1a1100');
                        if (isLeaf) child.material.color.set('#556B2F');
                        break;

                    case CONDITIONS.MOLD_RISK:
                        if (isLeaf) {
                            child.material.color.set('#778899'); // Grayish
                            child.material.roughness = 1.0;
                        }
                        break;

                    case CONDITIONS.BLOSSOM_DROP:
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.WILTING_WET:
                        if (isLeaf) child.material.color.set('#2F4F4F'); // Dark Slate
                        if (isFruit) child.visible = false;
                        break;

                    case CONDITIONS.SLOW_GROWTH:
                        // Slightly paler
                        if (isLeaf) child.material.color.lerp({ r: 0.8, g: 0.8, b: 0.6 }, 0.3);
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
                <group scale={0.5} position={[0, 0, -5]}>
                    <primitive object={scene} />
                </group>
            </Center>
        </group>
    );
}
