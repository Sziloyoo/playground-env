import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'lil-gui';
import gsap from 'gsap';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */
scene.add(new THREE.AxesHelper())

// Define params and arrays
const boxRadius = 10;
const laserRadius = 5;
const boxes = [];

// Create materials for active and inactive boxes
const activeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const inactiveMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })

// Create boxes
const ring = createRing(boxRadius, 1)
scene.add(ring)

// Create laser
const laserCircle = new THREE.Object3D();
scene.add(laserCircle);

const laserOrigin = new THREE.Object3D()
laserOrigin.position.set(0, laserRadius, 0)
laserCircle.add(laserOrigin)

// Create a raycaster and an ArrowHelper for visualization
const raycaster = new THREE.Raycaster()
const rayHelper = new THREE.ArrowHelper(
    new THREE.Vector3(0, -laserRadius, 0),  // Placeholder direction
    laserOrigin.position,                   // Placeholder origin
    4,                                      // Length of the arrow
    0xff0000                                // Color
);
scene.add(rayHelper)

// CREATE LASER PLANE
const maxRayLength = 24
const rayPlaneGeometry = new THREE.PlaneGeometry(1, maxRayLength)
rayPlaneGeometry.translate(0, maxRayLength / 2, 0) // Move geometry pivot to bottom
const rayPlaneMesh = new THREE.Mesh(rayPlaneGeometry, new THREE.MeshBasicMaterial())
rayPlaneMesh.rotation.z = Math.PI
rayPlaneMesh.position.set(0, laserRadius, 0)
laserCircle.add(rayPlaneMesh)
// LASER PLANE END

/**
 * Events
 */
const eventLeft = () => {
    gsap.to(laserCircle.rotation, {
        duration: .3,
        z: laserCircle.rotation.z + Math.PI / 6,
        ease: 'power2.inOut'
    });
}

const eventRight = () => {
    gsap.to(laserCircle.rotation, {
        duration: .3,
        z: laserCircle.rotation.z - Math.PI / 6,
        ease: 'power2.inOut'
    });
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 20
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Debug GUI
 */
const gui = new GUI()
gui.add({ eventLeft: eventLeft }, 'eventLeft').name('rotate left')
gui.add({ eventRight: eventRight }, 'eventRight').name('rotate right')
gui.add(rayPlaneMesh.scale, 'y', 0, 2)


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Update raycaster origin and direction
    const newPosition = new THREE.Vector3()
    laserOrigin.getWorldPosition(newPosition)
    raycaster.ray.origin.copy(newPosition)

    raycaster.ray.direction.copy(newPosition.clone().negate().normalize())

    // Update helpers
    rayHelper.position.copy(raycaster.ray.origin);
    rayHelper.setDirection(raycaster.ray.direction);

    // Test raycaster against all boxes
    const intersections = raycaster.intersectObjects(boxes)
    handleIntersections(intersections)

    // Update rayPlane
    let rayLength = maxRayLength

    if (intersections.length > 0) {
        rayLength = intersections[0].distance // Set ray length to the nearest hit
    }

    rayPlaneMesh.scale.set(1, rayLength / maxRayLength, 1)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

/**
 * Functions
 */
function createRing(radius, size) {
    // Create a pivot object at the origin
    const pivot = new THREE.Object3D()
    scene.add(pivot)

    // Create 12 boxes and add them to the pivot
    const boxGeometry = new THREE.BoxGeometry(size, size, size)

    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12 // 30 degrees in radians
        const x = radius * Math.cos(angle)
        const y = radius * Math.sin(angle)

        const box = new THREE.Mesh(boxGeometry, inactiveMaterial)
        boxes.push(box)
        box.position.set(x, y, 0) // y = 0 to keep boxes on the ground
        pivot.add(box)
    }
    return pivot
}

function handleIntersections(intersections) {
    if (intersections.length == 1) {
        // Change color of the intersected box
        intersections[0].object.material = activeMaterial
    } else {
        // Reset color if not intersecting, but this is wrong!
        boxes.forEach((box) => box.material = inactiveMaterial)
    }
}
