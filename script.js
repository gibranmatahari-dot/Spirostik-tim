// Variabel global
let scene, camera, renderer, cylinder, leaves = [], guideLines = [], spiralLines = [];
let controls;

// Inisialisasi scene Three.js
function init() {
    // Buat scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9f9f9);
    
    // Setup camera
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    document.getElementById('diagram-container').appendChild(renderer.domElement);
    
    // Tambahkan kontrol orbit
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Tambahkan pencahayaan
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    // Buat tabung dasar
    createCylinder();
    
    // Generate diagram awal
    generateDiagram(3, 8);
    
    // Event listener untuk tombol generate
    document.getElementById('generate-btn').addEventListener('click', function() {
        const numerator = parseInt(document.getElementById('numerator').value);
        const denominator = parseInt(document.getElementById('denominator').value);
        generateDiagram(numerator, denominator);
    });
    
    // Mulai animasi
    animate();
}

// Fungsi untuk membuat tabung
function createCylinder() {
    const geometry = new THREE.CylinderGeometry(2, 2, 10, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x8d6e63,
        transparent: true,
        opacity: 0.3,
        wireframe: false
    });
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.y = 0;
    scene.add(cylinder);
}

// Fungsi untuk membuat daun
function createLeaf(angle, height, size = 0.8) {
    const leafGeometry = new THREE.CircleGeometry(size, 32);
    const leafMaterial = new THREE.MeshPhongMaterial({
        color: 0x4caf50,
        side: THREE.DoubleSide,
        flatShading: true
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    
    // Posisikan daun
    const radius = 2.1; // Sedikit di luar tabung
    leaf.position.x = radius * Math.sin(angle);
    leaf.position.y = height;
    leaf.position.z = radius * Math.cos(angle);
    
    // Rotasi daun agar rata dengan permukaan tabung
    leaf.rotation.x = Math.PI / 2;
    leaf.rotation.y = -angle;
    
    return leaf;
}

// Fungsi untuk membuat garis spiral
function createSpiral(numerator, denominator) {
    // Hapus spiral sebelumnya
    spiralLines.forEach(line => scene.remove(line));
    spiralLines = [];
    
    const spiralMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 2
    });
    
    const points = [];
    const segments = 100;
    const heightTotal = 8; // Tinggi total spiral
    const startHeight = -4; // Mulai dari bawah
    
    for (let i = 0; i <= segments; i++) {
        const progress = i / segments;
        const angle = progress * numerator * Math.PI * 2;
        const height = startHeight + progress * heightTotal;
        const radius = 2.05; // Sedikit di dalam daun
        
        points.push(new THREE.Vector3(
            radius * Math.sin(angle),
            height,
            radius * Math.cos(angle)
        ));
    }
    
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    scene.add(spiral);
    spiralLines.push(spiral);
}

// Fungsi untuk membuat garis panduan vertikal
function createVerticalGuides(denominator) {
    // Hapus panduan sebelumnya
    guideLines.forEach(line => scene.remove(line));
    guideLines = [];
    
    const guideMaterial = new THREE.LineBasicMaterial({ 
        color: 0x0000ff,
        linewidth: 1
    });
    
    // Buat garis vertikal untuk setiap daun
    for (let i = 0; i < denominator; i++) {
        const angle = (i / denominator) * Math.PI * 2;
        const points = [];
        const radius = 2.3; // Di luar daun
        
        // Titik atas
        points.push(new THREE.Vector3(
            radius * Math.sin(angle),
            5,
            radius * Math.cos(angle)
        ));
        
        // Titik bawah
        points.push(new THREE.Vector3(
            radius * Math.sin(angle),
            -5,
            radius * Math.cos(angle)
        ));
        
        const guideGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const guideLine = new THREE.Line(guideGeometry, guideMaterial);
        
        // Buat garis putus-putus untuk panduan
        guideLine.material.dashSize = 0.2;
        guideLine.material.gapSize = 0.1;
        
        scene.add(guideLine);
        guideLines.push(guideLine);
    }
}

// Fungsi utama untuk menghasilkan diagram
function generateDiagram(numerator, denominator) {
    // Update info
    document.getElementById('formula').textContent = `${numerator}/${denominator}`;
    const angleDeg = (360 * numerator / denominator).toFixed(1);
    document.getElementById('angle').textContent = `${angleDeg}°`;
    
    // Hapus daun sebelumnya
    leaves.forEach(leaf => scene.remove(leaf));
    leaves = [];
    
    // Buat spiral dan panduan
    createSpiral(numerator, denominator);
    createVerticalGuides(denominator);
    
    // Buat daun
    const angleStep = (2 * Math.PI * numerator) / denominator;
    const heightStep = 8 / denominator;
    
    for (let i = 0; i < denominator; i++) {
        const angle = i * angleStep;
        const height = -4 + i * heightStep;
        const leaf = createLeaf(angle, height);
        scene.add(leaf);
        leaves.push(leaf);
        
        // Tambahkan nomor daun
        addLeafNumber(angle, height, i);
    }
}

// Fungsi untuk menambahkan nomor daun
function addLeafNumber(angle, height, number) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        const textGeometry = new THREE.TextGeometry(number.toString(), {
            font: font,
            size: 0.3,
            height: 0.05
        });
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Posisikan teks di depan daun
        const radius = 2.5;
        textMesh.position.x = radius * Math.sin(angle);
        textMesh.position.y = height;
        textMesh.position.z = radius * Math.cos(angle);
        
        // Hadapkan teks ke kamera
        textMesh.quaternion.copy(camera.quaternion);
        
        scene.add(textMesh);
        leaves.push(textMesh);
    });
}

// Fungsi animasi
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Mulai aplikasi
init();