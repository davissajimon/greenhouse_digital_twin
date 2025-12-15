import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useSpring, a } from '@react-spring/three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils'
import * as THREE from 'three'

export default function TomatoPlant({ healthStatus = 'healthy', position = [0, -1, 0], ...props }) {
    // Load assets (Using existing filenames found in public folder)
    const pot = useGLTF('/pot.glb')
    const stem = useGLTF('/stem.glb')

    // Load variants
    const leaves = [
        useGLTF('/leaf1.glb'),
        useGLTF('/leaf2.glb'),
        useGLTF('/leaf3.glb'),
        useGLTF('/leaf4.glb')
    ]
    const tomatoes = [
        useGLTF('/tomato1.glb'),
        useGLTF('/tomato2.glb'),
        useGLTF('/tomato3.glb'),
        useGLTF('/tomato4.glb')
    ]

    // --- PROCEDURAL CONFIG ---

    // 1. Leaf Arrangement: Golden Spiral (Phyllotaxis)
    const leafConfig = useMemo(() => {
        const items = []
        const count = 12
        const startY = 0.5
        const endY = 2.5
        const stepY = (endY - startY) / count
        const goldenAngle = 137.5 * (Math.PI / 180) // ~2.399 rad

        for (let i = 0; i < count; i++) {
            const y = startY + (i * stepY)
            const rotY = i * goldenAngle
            const radius = 0.1 // Offset from stem

            // Polar to Cartesian for placement container
            const x = Math.cos(rotY) * radius
            const z = Math.sin(rotY) * radius

            const modelIndex = Math.floor(Math.random() * 4)
            const scale = 0.8 + Math.random() * 0.4 // 0.8 - 1.2

            items.push({ x, y, z, rotY, modelIndex, scale })
        }
        return items
    }, [])

    // 2. Tomato Arrangement: Hanging from mid-section
    const tomatoConfig = useMemo(() => {
        const items = []
        const count = 6
        const goldenAngle = 137.5 * (Math.PI / 180)

        for (let i = 0; i < count; i++) {
            const y = 0.8 + Math.random() * 0.7 // 0.8 to 1.5
            // Spiral them too so they don't bunch up, but add randomness
            const rotY = (i * goldenAngle) + (Math.random() * 0.5)
            const radius = 0.3 // Further out

            const x = Math.cos(rotY) * radius
            const z = Math.sin(rotY) * radius

            // Random dangle (Z rotation)
            const rotZ = (Math.random() - 0.5) * 0.5 // -0.25 to 0.25 rad

            const modelIndex = Math.floor(Math.random() * 4)
            items.push({ x, y, z, rotY, rotZ, modelIndex })
        }
        return items
    }, [])


    // --- ANIMATION / HEALTH LOGIC ---
    const isCritical = healthStatus === 'critical'

    const { leafColor, leafDroop } = useSpring({
        leafColor: isCritical ? '#8B4513' : '#228B22',
        leafDroop: isCritical ? Math.PI / 4 : 0, // 45 degrees if critical
        config: { tension: 40, friction: 14 }
    })

    // Helper to clone scenes safely
    const getInstance = (gltf) => clone(gltf.scene)

    return (
        <group position={position} {...props} dispose={null}>

            {/* BASE */}
            <primitive object={pot.scene} position={[0, 0, 0]} />
            <primitive object={stem.scene} position={[0, 0.2, 0]} />

            {/* LEAVES */}
            {leafConfig.map((cfg, i) => {
                const scene = useMemo(() => getInstance(leaves[cfg.modelIndex]), [cfg.modelIndex]) // Memo clone? Actually clone needs to be per instance if we modify internal materials deeply, but for simple prop-based color we can use <a.primitive> or context.
                // However, primitive does not support color prop on the whole hierarchy instantly.
                // We must color the mesh. Since we are animating color, we need a persistent material reference or <a.mesh>.
                // Complex with GLTF + Spring.
                // Strategy: Traverse once, replace materials with a cloned StandardMaterial that we can control?
                // OR: Just bind the color prop if the GLTF structure allows.
                // SIMPLEST: Re-traverse in a side-effect if color changes? No, slow.
                // BETTER: Use <a.mesh> if we can find the mesh geometry. 

                // Let's assume leaf GLB is simple (1 mesh).
                let geometry = null
                scene.traverse(o => { if (o.isMesh && !geometry) geometry = o.geometry })

                if (!geometry) return null

                return (
                    <group
                        key={`leaf-${i}`}
                        position={[cfg.x, cfg.y, cfg.z]}
                        rotation={[0, -cfg.rotY, 0]} // Rotate group to face "out" (negative Y rot to align with radial)
                    >
                        {/* The actual leaf mesh, rotated by droop */}
                        <a.mesh
                            geometry={geometry}
                            rotation-x={leafDroop} // Animate droop
                            scale={cfg.scale}
                        >
                            <a.meshStandardMaterial color={leafColor} side={THREE.DoubleSide} />
                        </a.mesh>
                    </group>
                )
            })}

            {/* TOMATOES */}
            {tomatoConfig.map((cfg, i) => {
                const scene = useMemo(() => getInstance(tomatoes[cfg.modelIndex]), [cfg.modelIndex])

                return (
                    <primitive
                        key={`tomato-${i}`}
                        object={scene}
                        position={[cfg.x, cfg.y, cfg.z]}
                        rotation={[0, -cfg.rotY, cfg.rotZ]}
                        scale={1}
                    />
                )
            })}

        </group>
    )
}

// Preload
useGLTF.preload('/pot.glb')
useGLTF.preload('/stem.glb')
    ;['/leaf1.glb', '/leaf2.glb', '/leaf3.glb', '/leaf4.glb'].forEach(s => useGLTF.preload(s));
;['/tomato1.glb', '/tomato2.glb', '/tomato3.glb', '/tomato4.glb'].forEach(s => useGLTF.preload(s));
