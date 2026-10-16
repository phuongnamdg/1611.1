"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Sparkles, RotateCw } from "lucide-react";

interface Props {
  isCandleBlown: boolean;
  onExtinguishCandle: () => void;
}

export default function ThreeCake3D({ isCandleBlown, onExtinguishCandle }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isRotatingManually, setIsRotatingManually] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 340;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 3.8, 9.2);
    camera.lookAt(0, 0.2, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xfff0f5, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffe4e6, 0xffccd5, 0.6);
    scene.add(hemiLight);

    // Ánh sáng ngọn nến lung linh
    const candleLight = new THREE.PointLight(0xffaa00, 2.8, 12);
    candleLight.position.set(0, 2.7, 0);
    candleLight.castShadow = true;
    scene.add(candleLight);

    // 4. CAKE GROUP (Để xoay toàn bộ bánh)
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // VẬT LIỆU CAO CẤP
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1,
    });

    const tier1Material = new THREE.MeshStandardMaterial({
      color: 0xf8a5b8, // Hồng phấn đậm nhẹ
      roughness: 0.35,
      metalness: 0.05,
    });

    const tier2Material = new THREE.MeshStandardMaterial({
      color: 0xffb7c5, // Hồng hoa đào
      roughness: 0.35,
      metalness: 0.05,
    });

    const tier3Material = new THREE.MeshStandardMaterial({
      color: 0xffc2d1, // Hồng pastel baby
      roughness: 0.35,
      metalness: 0.05,
    });

    const creamMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
    });

    const strawberryMaterial = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.3,
      metalness: 0.1,
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x588157,
      roughness: 0.6,
    });

    // --- ĐĨA BÁNH (PLATE) ---
    const plateGeo = new THREE.CylinderGeometry(3.6, 3.4, 0.2, 48);
    const plateMesh = new THREE.Mesh(plateGeo, plateMaterial);
    plateMesh.position.y = -1.6;
    plateMesh.receiveShadow = true;
    cakeGroup.add(plateMesh);

    // --- TẦNG 1 (ĐÁY - RỘNG NHẤT) ---
    const t1Geo = new THREE.CylinderGeometry(2.8, 2.8, 1.1, 48);
    const t1Mesh = new THREE.Mesh(t1Geo, tier1Material);
    t1Mesh.position.y = -0.95;
    t1Mesh.castShadow = true;
    t1Mesh.receiveShadow = true;
    cakeGroup.add(t1Mesh);

    // Kem phủ tầng 1
    const c1Geo = new THREE.CylinderGeometry(2.85, 2.85, 0.18, 48);
    const c1Mesh = new THREE.Mesh(c1Geo, creamMaterial);
    c1Mesh.position.y = -0.4;
    cakeGroup.add(c1Mesh);

    // Dải giọt kem viền tầng 1
    const dripCount1 = 20;
    for (let i = 0; i < dripCount1; i++) {
      const angle = (i / dripCount1) * Math.PI * 2;
      const dripGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const dripMesh = new THREE.Mesh(dripGeo, creamMaterial);
      dripMesh.position.set(
        Math.cos(angle) * 2.82,
        -0.45 - (i % 2 === 0 ? 0.08 : 0.02),
        Math.sin(angle) * 2.82
      );
      cakeGroup.add(dripMesh);
    }

    // --- TẦNG 2 (GIỮA) ---
    const t2Geo = new THREE.CylinderGeometry(2.0, 2.0, 0.95, 48);
    const t2Mesh = new THREE.Mesh(t2Geo, tier2Material);
    t2Mesh.position.y = 0.1;
    t2Mesh.castShadow = true;
    t2Mesh.receiveShadow = true;
    cakeGroup.add(t2Mesh);

    // Kem phủ tầng 2
    const c2Geo = new THREE.CylinderGeometry(2.05, 2.05, 0.16, 48);
    const c2Mesh = new THREE.Mesh(c2Geo, creamMaterial);
    c2Mesh.position.y = 0.58;
    cakeGroup.add(c2Mesh);

    // Dâu tây tầng 2
    const strawCount2 = 8;
    for (let i = 0; i < strawCount2; i++) {
      const angle = (i / strawCount2) * Math.PI * 2;
      const strawGeo = new THREE.ConeGeometry(0.18, 0.35, 16);
      const strawMesh = new THREE.Mesh(strawGeo, strawberryMaterial);
      strawMesh.position.set(
        Math.cos(angle) * 2.4,
        -0.3,
        Math.sin(angle) * 2.4
      );
      strawMesh.rotation.x = Math.PI;
      strawMesh.castShadow = true;
      cakeGroup.add(strawMesh);

      // Lá dâu
      const leafGeo = new THREE.CylinderGeometry(0.12, 0.02, 0.05, 6);
      const leafMesh = new THREE.Mesh(leafGeo, leafMaterial);
      leafMesh.position.set(
        Math.cos(angle) * 2.4,
        -0.12,
        Math.sin(angle) * 2.4
      );
      cakeGroup.add(leafMesh);
    }

    // --- TẦNG 3 (TRÊN CÙNG) ---
    const t3Geo = new THREE.CylinderGeometry(1.25, 1.25, 0.85, 48);
    const t3Mesh = new THREE.Mesh(t3Geo, tier3Material);
    t3Mesh.position.y = 1.05;
    t3Mesh.castShadow = true;
    t3Mesh.receiveShadow = true;
    cakeGroup.add(t3Mesh);

    // Lớp kem trắng phủ tràn tầng 3
    const c3Geo = new THREE.CylinderGeometry(1.3, 1.3, 0.18, 48);
    const c3Mesh = new THREE.Mesh(c3Geo, creamMaterial);
    c3Mesh.position.y = 1.48;
    cakeGroup.add(c3Mesh);

    // Dâu tây và kem trang trí tầng trên
    const topStrawCount = 6;
    for (let i = 0; i < topStrawCount; i++) {
      const angle = (i / topStrawCount) * Math.PI * 2;
      // Quả dâu
      const strawGeo = new THREE.ConeGeometry(0.16, 0.3, 16);
      const strawMesh = new THREE.Mesh(strawGeo, strawberryMaterial);
      strawMesh.position.set(
        Math.cos(angle) * 0.95,
        1.65,
        Math.sin(angle) * 0.95
      );
      strawMesh.rotation.x = Math.PI;
      strawMesh.castShadow = true;
      cakeGroup.add(strawMesh);

      // Đốm kem xen kẽ
      const creamDotGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const creamDotMesh = new THREE.Mesh(creamDotGeo, creamMaterial);
      const dotAngle = angle + Math.PI / topStrawCount;
      creamDotMesh.position.set(
        Math.cos(dotAngle) * 0.95,
        1.55,
        Math.sin(dotAngle) * 0.95
      );
      cakeGroup.add(creamDotMesh);
    }

    // --- CÂY NẾN SINH NHẬT (CANDLE) ---
    const candleGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 24);
    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });
    const candleMesh = new THREE.Mesh(candleGeo, candleMat);
    candleMesh.position.set(0, 1.9, 0);
    candleMesh.castShadow = true;
    cakeGroup.add(candleMesh);

    // Sọc xoắn màu hồng trên nến
    const stripeCount = 4;
    for (let i = 0; i < stripeCount; i++) {
      const stripeGeo = new THREE.TorusGeometry(0.092, 0.015, 8, 24);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.position.set(0, 1.65 + i * 0.16, 0);
      stripeMesh.rotation.x = Math.PI / 2;
      cakeGroup.add(stripeMesh);
    }

    // Bấc nến
    const wickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 2.35, 0);
    cakeGroup.add(wickMesh);

    // --- NGỌN LỬA 3D LUNG LINH ---
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 2.52, 0);
    cakeGroup.add(flameGroup);

    // Lõi lửa vàng óng
    const flameCoreGeo = new THREE.ConeGeometry(0.09, 0.26, 16);
    const flameCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const flameCoreMesh = new THREE.Mesh(flameCoreGeo, flameCoreMat);
    flameGroup.add(flameCoreMesh);

    // Vỏ lửa vàng cam
    const flameOuterGeo = new THREE.ConeGeometry(0.15, 0.38, 16);
    const flameOuterMat = new THREE.MeshBasicMaterial({
      color: 0xff9e00,
      transparent: true,
      opacity: 0.85,
    });
    const flameOuterMesh = new THREE.Mesh(flameOuterGeo, flameOuterMat);
    flameGroup.add(flameOuterMesh);

    // Quầng sáng hào quang (Aura)
    const auraGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.35,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    flameGroup.add(auraMesh);

    // 5. TƯƠNG TÁC XOAY 360 ĐỘ BẰNG CHUỘT / CHẠM TAY
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      setIsRotatingManually(true);
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      cakeGroup.rotation.y += deltaX * 0.012;
      cakeGroup.rotation.x = Math.max(
        -0.2,
        Math.min(0.4, cakeGroup.rotation.x + deltaY * 0.008)
      );

      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
      setTimeout(() => setIsRotatingManually(false), 2500);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handlePointerDown);
    domElement.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    domElement.addEventListener("touchstart", handlePointerDown, { passive: true });
    domElement.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    // Bấm vào bánh để thổi nến nếu chưa thổi
    domElement.addEventListener("click", () => {
      if (!isCandleBlown) {
        onExtinguishCandle();
      }
    });

    // 6. ANIMATION LOOP 60 FPS
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Tự động xoay nhẹ nhàng khi không ai chạm
      if (!isDragging) {
        cakeGroup.rotation.y += 0.006;
      }

      // Hiệu ứng ngọn lửa bập bùng chân thật
      if (!isCandleBlown) {
        const flicker = Math.sin(elapsed * 18) * 0.06;
        const wobble = Math.cos(elapsed * 12) * 0.03;
        flameGroup.scale.set(1 + flicker, 1 + flicker * 1.4, 1 + flicker);
        flameGroup.rotation.z = wobble;
        candleLight.intensity = 2.6 + Math.sin(elapsed * 24) * 0.5;
        flameGroup.visible = true;
        candleLight.visible = true;
      } else {
        flameGroup.visible = false;
        candleLight.visible = false;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      domElement.removeEventListener("mousedown", handlePointerDown);
      domElement.removeEventListener("mousemove", handlePointerMove);
      domElement.removeEventListener("touchstart", handlePointerDown);
      domElement.removeEventListener("touchmove", handlePointerMove);
      renderer.dispose();
    };
  }, [isCandleBlown, onExtinguishCandle]);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* KHUNG WEBGL 3D BÁNH SINH NHẬT */}
      <div
        ref={mountRef}
        className="w-full h-[320px] sm:h-[350px] rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
      />

      {/* DÒNG HƯỚNG DẪN TƯƠNG TÁC XOAY */}
      <div className="flex items-center justify-between w-full max-w-xs px-3 py-1 bg-white/75 backdrop-blur-xs rounded-full border border-pink-200/80 shadow-xs text-[11px] text-pink-700 font-medium mt-1">
        <span className="flex items-center gap-1">
          <RotateCw className="w-3.5 h-3.5 text-pink-500 animate-spin" />
          Kéo chuột / vuốt để xoay 3D 360°
        </span>
        <span className="text-[10px] text-pink-500">
          {isRotatingManually ? "Đang xoay tự do" : "Tự động xoay nhẹ"}
        </span>
      </div>

      {/* THÔNG BÁO KHI NẾN TẮT */}
      {isCandleBlown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-pink-500/90 text-white text-xs font-bold shadow-md backdrop-blur-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          Nến 3D đã tắt! Khói bốc lên ngát hương dâu!
        </motion.div>
      )}
    </div>
  );
}
