"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Sparkles, RotateCw, Heart } from "lucide-react";

interface Props {
  isCandleBlown: boolean;
  canClickToExtinguish: boolean;
  onExtinguishCandle: () => void;
}

// 🎂 HÀM TẠO KHỐI BÁNH BO GÓC TRÒN CỰC MỊN (ROUNDED LATHE GEOMETRY)
// Giúp bánh có độ phồng mềm mại như kem Fondant / Marshmallow, không bị góc cạnh thô ráp
function createRoundedCylinderGeo(
  radius: number,
  height: number,
  bevel: number,
  radialSegments = 64
) {
  const points: THREE.Vector2[] = [];
  const segments = 12;
  const h2 = height / 2;

  // Điểm tâm đáy
  points.push(new THREE.Vector2(0, -h2));
  // Đáy phẳng
  points.push(new THREE.Vector2(Math.max(0, radius - bevel), -h2));

  // Bo cong góc đáy
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + (i / segments) * (Math.PI / 2);
    points.push(
      new THREE.Vector2(
        radius - bevel + Math.cos(a) * bevel,
        -h2 + bevel + Math.sin(a) * bevel
      )
    );
  }

  // Thân đứng
  points.push(new THREE.Vector2(radius, h2 - bevel));

  // Bo cong góc trên
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * (Math.PI / 2);
    points.push(
      new THREE.Vector2(
        radius - bevel + Math.cos(a) * bevel,
        h2 - bevel + Math.sin(a) * bevel
      )
    );
  }

  // Điểm tâm đỉnh
  points.push(new THREE.Vector2(0, h2));

  return new THREE.LatheGeometry(points, radialSegments);
}

// 🍓 HÀM TẠO QUẢ DÂU TÂY 3D BÓNG BẨY DỄ THƯƠNG
function createStrawberryGeo() {
  const points: THREE.Vector2[] = [];
  const count = 18;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const y = (1 - t) * 0.45; // Chiều cao
    // Đường cong hình quả dâu bầu bĩnh
    const r = Math.sin(t * Math.PI) * 0.22 * (1 - t * 0.35);
    points.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(points, 24);
}

export default function ThreeCake3D({
  isCandleBlown,
  canClickToExtinguish,
  onExtinguishCandle,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 3.4, 8.8);
    camera.lookAt(0, 0.1, 0);

    // 2. RENDERER CHẤT LƯỢNG CAO (ACES Filmic Tone Mapping)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. ÁNH SÁNG ẤM ÁP TẠO ĐỘ MỊN MÀNG
    const ambientLight = new THREE.AmbientLight(0xfff5f8, 1.6);
    scene.add(ambientLight);

    // Đèn chính góc trên chiếu bóng mềm
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(4, 9, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Đèn phụ ánh hồng hắt ngược từ bên trái tạo chiều sâu
    const fillLight = new THREE.DirectionalLight(0xffccd5, 1.1);
    fillLight.position.set(-4, 4, 3);
    scene.add(fillLight);

    // Đèn điểm ngọn nến lung linh
    const candleLight = new THREE.PointLight(0xffb703, 3.2, 12, 1.5);
    candleLight.position.set(0, 2.5, 0);
    candleLight.castShadow = true;
    scene.add(candleLight);

    // 4. NHÓM CHÍNH TOÀN BỘ CHIẾC BÁNH (CAKE ROOT)
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // =========================================================================
    // 🎨 CHẤT LIỆU CAO CẤP PHONG CÁCH HÀN QUỐC (KOREAN AESTHETIC CLAY / ICING)
    // =========================================================================

    // Sứ trắng cao cấp (Porcelain Cake Stand)
    const porcelainMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
    });

    // Cốt bánh tầng 1 (Hồng phấn dâu ngọt ngào)
    const cakeTier1Mat = new THREE.MeshPhysicalMaterial({
      color: 0xf8a5b8,
      roughness: 0.35,
      clearcoat: 0.25,
      clearcoatRoughness: 0.15,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xffccd5),
    });

    // Cốt bánh tầng 2 (Hồng hoa đào baby dịu dàng)
    const cakeTier2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xffb7c5,
      roughness: 0.35,
      clearcoat: 0.25,
      clearcoatRoughness: 0.15,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xffe3ec),
    });

    // Cốt bánh tầng 3 (Hồng kem tươi phớt nhẹ)
    const cakeTier3Mat = new THREE.MeshPhysicalMaterial({
      color: 0xffccd5,
      roughness: 0.35,
      clearcoat: 0.25,
      clearcoatRoughness: 0.15,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xfff0f5),
    });

    // Lớp kem tươi trắng mịn béo ngậy
    const richCreamMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xfff5f8),
    });

    // Dâu tây đỏ mọng phủ đường bóng
    const strawberryMat = new THREE.MeshPhysicalMaterial({
      color: 0xe63946,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05,
    });

    // Lá dâu xanh mát
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4f772d,
      roughness: 0.5,
    });

    // =========================================================================
    // 🍰 DỰNG HÌNH CHI TIẾT BÁNH KEM 3 TẦNG BO TRÒN MỀM MẠI
    // =========================================================================

    // 1. ĐĨA SỨ CHÂN CAO PHONG CÁCH TIỆC TRÀ HOÀNG GIA (PEDESTAL STAND)
    const standPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, -1.8),
      new THREE.Vector2(1.8, -1.8),
      new THREE.Vector2(1.6, -1.72),
      new THREE.Vector2(0.45, -1.5),
      new THREE.Vector2(0.4, -1.35),
      new THREE.Vector2(0.65, -1.25),
      new THREE.Vector2(3.2, -1.2),
      new THREE.Vector2(3.25, -1.12),
      new THREE.Vector2(0, -1.12),
    ];
    const standGeo = new THREE.LatheGeometry(standPoints, 64);
    const standMesh = new THREE.Mesh(standGeo, porcelainMat);
    standMesh.receiveShadow = true;
    standMesh.castShadow = true;
    cakeGroup.add(standMesh);

    // Viền kim loại ánh vàng nhẹ trên đĩa sứ
    const rimGeo = new THREE.TorusGeometry(3.23, 0.025, 16, 64);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.25,
      metalness: 0.8,
    });
    const rimMesh = new THREE.Mesh(rimGeo, goldMat);
    rimMesh.position.y = -1.14;
    rimMesh.rotation.x = Math.PI / 2;
    cakeGroup.add(rimMesh);

    // 2. TẦNG 1 (ĐÁY - RỘNG NHẤT, BO TRÒN MỊN MÀNG)
    const t1Geo = createRoundedCylinderGeo(2.6, 0.95, 0.16);
    const t1Mesh = new THREE.Mesh(t1Geo, cakeTier1Mat);
    t1Mesh.position.y = -0.65;
    t1Mesh.castShadow = true;
    t1Mesh.receiveShadow = true;
    cakeGroup.add(t1Mesh);

    // Lớp kem phủ tầng 1 có giọt kem lượn sóng mềm mại
    const c1Geo = createRoundedCylinderGeo(2.64, 0.15, 0.07);
    const c1Mesh = new THREE.Mesh(c1Geo, richCreamMat);
    c1Mesh.position.y = -0.16;
    c1Mesh.castShadow = true;
    cakeGroup.add(c1Mesh);

    // Các giọt kem chảy dài ngẫu hứng viền tầng 1
    const dripCount1 = 28;
    for (let i = 0; i < dripCount1; i++) {
      const angle = (i / dripCount1) * Math.PI * 2;
      const dripLength = 0.08 + Math.sin(i * 3.5) * 0.05 + (i % 3 === 0 ? 0.06 : 0);
      const dripSphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const dripSphere = new THREE.Mesh(dripSphereGeo, richCreamMat);
      dripSphere.position.set(
        Math.cos(angle) * 2.62,
        -0.2 - dripLength,
        Math.sin(angle) * 2.62
      );
      cakeGroup.add(dripSphere);
    }

    // Hạt ngọc trai đường trang trí chân tầng 1
    const pearlCount1 = 32;
    for (let i = 0; i < pearlCount1; i++) {
      const angle = (i / pearlCount1) * Math.PI * 2;
      const pearlGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const pearl = new THREE.Mesh(pearlGeo, richCreamMat);
      pearl.position.set(
        Math.cos(angle) * 2.63,
        -1.08,
        Math.sin(angle) * 2.63
      );
      cakeGroup.add(pearl);
    }

    // 3. TẦNG 2 (GIỮA - BẦU BĨNH, XINH XẮN)
    const t2Geo = createRoundedCylinderGeo(1.85, 0.85, 0.14);
    const t2Mesh = new THREE.Mesh(t2Geo, cakeTier2Mat);
    t2Mesh.position.y = 0.28;
    t2Mesh.castShadow = true;
    t2Mesh.receiveShadow = true;
    cakeGroup.add(t2Mesh);

    // Lớp kem phủ tầng 2
    const c2Geo = createRoundedCylinderGeo(1.88, 0.14, 0.06);
    const c2Mesh = new THREE.Mesh(c2Geo, richCreamMat);
    c2Mesh.position.y = 0.72;
    c2Mesh.castShadow = true;
    cakeGroup.add(c2Mesh);

    // Dải giọt kem mềm tầng 2
    const dripCount2 = 20;
    for (let i = 0; i < dripCount2; i++) {
      const angle = (i / dripCount2) * Math.PI * 2;
      const dripLength = 0.06 + Math.sin(i * 4) * 0.04;
      const dripSphereGeo = new THREE.SphereGeometry(0.08, 14, 14);
      const dripSphere = new THREE.Mesh(dripSphereGeo, richCreamMat);
      dripSphere.position.set(
        Math.cos(angle) * 1.86,
        0.68 - dripLength,
        Math.sin(angle) * 1.86
      );
      cakeGroup.add(dripSphere);
    }

    // Dâu tây tươi đính quanh tầng 2
    const strawCount2 = 6;
    for (let i = 0; i < strawCount2; i++) {
      const angle = (i / strawCount2) * Math.PI * 2 + 0.3;
      const strawMesh = new THREE.Mesh(createStrawberryGeo(), strawberryMat);
      strawMesh.position.set(
        Math.cos(angle) * 2.15,
        -0.12,
        Math.sin(angle) * 2.15
      );
      strawMesh.rotation.z = Math.PI;
      strawMesh.rotation.y = -angle;
      strawMesh.castShadow = true;
      cakeGroup.add(strawMesh);

      // Bông kem nâng đỡ quả dâu
      const dollopGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const dollop = new THREE.Mesh(dollopGeo, richCreamMat);
      dollop.position.set(
        Math.cos(angle) * 2.15,
        -0.12,
        Math.sin(angle) * 2.15
      );
      dollop.scale.set(1.2, 0.8, 1.2);
      cakeGroup.add(dollop);
    }

    // 4. TẦNG 3 (TRÊN CÙNG - NHỎ NHẮN ĐÁNG YÊU)
    const t3Geo = createRoundedCylinderGeo(1.15, 0.75, 0.12);
    const t3Mesh = new THREE.Mesh(t3Geo, cakeTier3Mat);
    t3Mesh.position.y = 1.1;
    t3Mesh.castShadow = true;
    t3Mesh.receiveShadow = true;
    cakeGroup.add(t3Mesh);

    // Lớp kem vương trên đỉnh tầng 3
    const c3Geo = createRoundedCylinderGeo(1.18, 0.13, 0.05);
    const c3Mesh = new THREE.Mesh(c3Geo, richCreamMat);
    c3Mesh.position.y = 1.5;
    c3Mesh.castShadow = true;
    cakeGroup.add(c3Mesh);

    // Các quả dâu và chóp kem vương miện trên đỉnh bánh
    const crownCount = 6;
    for (let i = 0; i < crownCount; i++) {
      const angle = (i / crownCount) * Math.PI * 2;

      // Quả dâu mọng nước
      const strawMesh = new THREE.Mesh(createStrawberryGeo(), strawberryMat);
      strawMesh.position.set(
        Math.cos(angle) * 0.88,
        1.58,
        Math.sin(angle) * 0.88
      );
      strawMesh.rotation.z = Math.PI - 0.2;
      strawMesh.rotation.y = -angle;
      strawMesh.scale.set(0.85, 0.85, 0.85);
      strawMesh.castShadow = true;
      cakeGroup.add(strawMesh);

      // Chóp kem xoắn viền
      const creamPuffGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const creamPuff = new THREE.Mesh(creamPuffGeo, richCreamMat);
      const puffAngle = angle + Math.PI / crownCount;
      creamPuff.position.set(
        Math.cos(puffAngle) * 0.92,
        1.55,
        Math.sin(puffAngle) * 0.92
      );
      cakeGroup.add(creamPuff);
    }

    // 5. BIỂN TÊN / THẺ SOCOLA TRÁI TIM "16.11" TINH TẾ
    const tagGroup = new THREE.Group();
    tagGroup.position.set(0, -0.65, 2.65);
    cakeGroup.add(tagGroup);

    // Trái tim socola trắng
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.15, -0.25, 0.35, -0.4, 0.15);
    heartShape.bezierCurveTo(-0.55, -0.05, -0.3, -0.3, 0, -0.5);
    heartShape.bezierCurveTo(0.3, -0.3, 0.55, -0.05, 0.4, 0.15);
    heartShape.bezierCurveTo(0.25, 0.35, 0, 0.15, 0, 0);

    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const chocolateMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      clearcoat: 0.5,
    });
    const heartMesh = new THREE.Mesh(heartGeo, chocolateMat);
    heartMesh.rotation.z = Math.PI;
    heartMesh.scale.set(0.65, 0.65, 0.65);
    tagGroup.add(heartMesh);

    // 6. CÂY NẾN SINH NHẬT THANH MẢNH (ELEGANT TAPER CANDLE)
    const candleGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.85, 24);
    const candleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      clearcoat: 0.6,
    });
    const candleMesh = new THREE.Mesh(candleGeo, candleMat);
    candleMesh.position.set(0, 1.95, 0);
    candleMesh.castShadow = true;
    cakeGroup.add(candleMesh);

    // Sọc xoắn màu hồng pastel trên thân nến
    const stripeCount = 5;
    for (let i = 0; i < stripeCount; i++) {
      const stripeGeo = new THREE.TorusGeometry(0.073, 0.012, 8, 24);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.position.set(0, 1.62 + i * 0.14, 0);
      stripeMesh.rotation.x = Math.PI / 2;
      cakeGroup.add(stripeMesh);
    }

    // Bấc nến mảnh
    const wickGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x1f2421 });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 2.42, 0);
    cakeGroup.add(wickMesh);

    // 7. NGỌN LỬA 3D LUNG LINH HÌNH GIỌT NƯỚC (TEARDROP FLAME)
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 2.58, 0);
    cakeGroup.add(flameGroup);

    // Tạo dáng ngọn lửa hình giọt nước uốn lượn
    const flameProfile: THREE.Vector2[] = [];
    const fCount = 16;
    for (let i = 0; i <= fCount; i++) {
      const t = i / fCount;
      const y = t * 0.38; // Chiều cao ngọn lửa
      const r = Math.sin(t * Math.PI) * 0.12 * Math.pow(1 - t * 0.6, 0.5);
      flameProfile.push(new THREE.Vector2(r, y));
    }
    const flameGeo = new THREE.LatheGeometry(flameProfile, 24);

    // Lõi lửa vàng óng
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const flameCore = new THREE.Mesh(flameGeo, flameMat);
    flameCore.scale.set(0.65, 0.65, 0.65);
    flameGroup.add(flameCore);

    // Vỏ ngoài ngọn lửa vàng cam ấm áp
    const flameOuterMat = new THREE.MeshBasicMaterial({
      color: 0xffa200,
      transparent: true,
      opacity: 0.88,
    });
    const flameOuter = new THREE.Mesh(flameGeo, flameOuterMat);
    flameGroup.add(flameOuter);

    // Hào quang tỏa sáng mềm (Aura Glow)
    const auraGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.35,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.y = 0.16;
    flameGroup.add(auraMesh);

    // Đốm lửa xanh lam chân thực ở gốc bấc nến
    const blueBaseGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const blueBaseMat = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0.75,
    });
    const blueBase = new THREE.Mesh(blueBaseGeo, blueBaseMat);
    blueBase.position.y = 0.02;
    flameGroup.add(blueBase);

    // 8. CÁC HẠT ĐOM ĐÓM / BỤI VÀNG LẤP LÁNH QUANH NGỌN LỬA (SPARKLE PARTICLES)
    const sparkleCount = 14;
    const sparkleGroup = new THREE.Group();
    scene.add(sparkleGroup);

    const sparklesData: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; y: number }[] = [];
    for (let i = 0; i < sparkleCount; i++) {
      const sGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const sMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffd166 : 0xffffff,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      const angle = (i / sparkleCount) * Math.PI * 2;
      const radius = 0.6 + Math.random() * 0.8;
      const y = 2.2 + Math.random() * 0.9;
      sMesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      sparkleGroup.add(sMesh);
      sparklesData.push({ mesh: sMesh, angle, speed: 0.015 + Math.random() * 0.02, radius, y });
    }

    // =========================================================================
    // 🖐️ TƯƠNG TÁC XOAY 3D MƯỢT MÀ BẰNG CHUỘT HOẶC CẢM ỨNG ĐIỆN THOẠI
    // =========================================================================
    let isDragging = false;
    let prevPointer = { x: 0, y: 0 };
    let dragVelocity = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      setIsInteracting(true);
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevPointer = { x: cx, y: cy };
      dragVelocity = 0;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = cx - prevPointer.x;
      const deltaY = cy - prevPointer.y;

      cakeGroup.rotation.y += deltaX * 0.009;
      dragVelocity = deltaX * 0.009;

      // Giới hạn góc ngước nhìn bánh từ trên xuống
      cakeGroup.rotation.x = Math.max(
        -0.1,
        Math.min(0.35, cakeGroup.rotation.x + deltaY * 0.006)
      );

      prevPointer = { x: cx, y: cy };
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 2000);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onPointerDown);
    domEl.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    domEl.addEventListener("touchstart", onPointerDown, { passive: true });
    domEl.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Chạm vào bánh để thổi tắt nến (chỉ khi canClickToExtinguish là true)
    domEl.addEventListener("click", () => {
      if (!isCandleBlown && canClickToExtinguish) {
        onExtinguishCandle();
      }
    });

    // =========================================================================
    // 🔄 VÒNG LẶP HOẠT HỌA 60 FPS
    // =========================================================================
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Tự động xoay êm dịu khi không ai chạm
      if (!isDragging) {
        dragVelocity *= 0.95;
        cakeGroup.rotation.y += 0.005 + dragVelocity;
      }

      // Hoạt họa ngọn lửa nến bập bùng sống động
      if (!isCandleBlown) {
        const flicker = Math.sin(elapsed * 22) * 0.06;
        const sway = Math.cos(elapsed * 14) * 0.035;
        flameGroup.scale.set(1 + flicker * 0.8, 1 + flicker * 1.5, 1 + flicker * 0.8);
        flameGroup.rotation.z = sway;
        candleLight.intensity = 3.0 + Math.sin(elapsed * 26) * 0.6;
        flameGroup.visible = true;
        candleLight.visible = true;

        // Xoay các hạt bụi vàng lấp lánh quanh nến
        sparklesData.forEach((s) => {
          s.angle += s.speed;
          s.mesh.position.x = Math.cos(s.angle) * s.radius;
          s.mesh.position.z = Math.sin(s.angle) * s.radius;
          s.mesh.position.y = s.y + Math.sin(elapsed * 3 + s.angle) * 0.08;
          s.mesh.visible = true;
        });
      } else {
        flameGroup.visible = false;
        candleLight.visible = false;
        sparklesData.forEach((s) => (s.mesh.visible = false));
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 360;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      domEl.removeEventListener("mousedown", onPointerDown);
      domEl.removeEventListener("mousemove", onPointerMove);
      domEl.removeEventListener("touchstart", onPointerDown);
      domEl.removeEventListener("touchmove", onPointerMove);
      renderer.dispose();
    };
  }, [isCandleBlown, canClickToExtinguish, onExtinguishCandle]);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* VÙNG KHÔNG GIAN 3D BÁNH KEM BẦU BĨNH - HOÀN TOÀN KHÔNG CÓ CHỮ RƯỜM RÀ */}
      <div
        ref={mountRef}
        className="w-full h-[330px] sm:h-[370px] rounded-3xl flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
      />

      {/* THÔNG BÁO KHI NẾN TẮT */}
      {isCandleBlown && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          Nến đã tắt! Tuổi mới vạn sự hanh thông!
        </motion.div>
      )}
    </div>
  );
}
