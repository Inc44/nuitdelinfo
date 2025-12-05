const STATS_DATA = [
{
	value: 240,
	suffix: " M",
	label: "PCs menacés par fin Windows 10",
	source: "Canalys"
},
{
	value: 91,
	suffix: " %",
	label: "Écoles dépendantes des GAFAM",
	source: "Rapports Éducation"
},
{
	prefix: "+",
	value: 10,
	suffix: " ans",
	label: "Vie prolongée avec Linux",
	source: "ADEME"
},
{
	value: 0,
	suffix: " €",
	label: "Coût des logiciels libres",
	source: "FSF"
},
{
	value: 80,
	suffix: " %",
	label: "Empreinte carbone = fabrication",
	source: "GreenIT"
},
{
	value: 62,
	suffix: " Mt",
	label: "Déchets électroniques par an",
	source: "E-waste Monitor"
},
{
	value: 100,
	suffix: " %",
	label: "Supercalculateurs sous Linux",
	source: "TOP500"
}];
let carouselState = null;

function initCarousel()
{
	const container = document.getElementById('carousel-scene');
	if (!container) return;
	if (typeof THREE === 'undefined') return console.error('Three.js not loaded');
	const width = container.clientWidth,
		height = 220;
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
	const renderer = new THREE.WebGLRenderer(
	{
		antialias: true,
		alpha: true
	});
	renderer.setSize(width, height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	container.appendChild(renderer.domElement);
	const n = STATS_DATA.length,
		theta = (2 * Math.PI) / n,
		radius = 280;
	const cards = [],
		cardData = [];
	const group = new THREE.Group();
	scene.add(group);
	for (let i = 0; i < n; i++)
	{
		const
		{
			canvas,
			ctx,
			texture
		} = createCardCanvas(STATS_DATA[i], i, 0);
		const material = new THREE.MeshBasicMaterial(
		{
			map: texture,
			transparent: true,
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), material);
		const angle = theta * i;
		mesh.position.x = Math.sin(angle) * radius;
		mesh.position.z = Math.cos(angle) * radius;
		mesh.rotation.y = angle;
		cards.push(mesh);
		cardData.push(
		{
			canvas,
			ctx,
			texture,
			data: STATS_DATA[i],
			index: i
		});
		group.add(mesh);
	}
	camera.position.z = radius + 140;
	carouselState = {
		cards,
		cardData,
		group,
		renderer,
		scene,
		camera,
		theta,
		radius,
		n,
		currentIndex: 0,
		targetRotation: 0,
		currentRotation: 0,
		animatingCard: -1,
		animationProgress: 0
	};
	const dotsContainer = document.getElementById('carousel-dots');
	dotsContainer.innerHTML = '';
	for (let i = 0; i < n; i++)
	{
		const dot = document.createElement('div');
		dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
		dot.onclick = () => goToCard(i);
		dotsContainer.appendChild(dot);
	}
	document.getElementById('carousel-prev')
		.onclick = () => rotateCarousel(-1);
	document.getElementById('carousel-next')
		.onclick = () => rotateCarousel(1);
	document.addEventListener('keydown', handleKeydown);
	let touchStartX = 0;
	container.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX,
	{
		passive: true
	});
	container.addEventListener('touchend', e =>
	{
		const diff = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(diff) > 50) rotateCarousel(diff < 0 ? 1 : -1);
	});
	updateCardVisibility();
	startCountAnimation(0);
	animateCarousel();
	window.addEventListener('resize', handleResize);
}

function handleKeydown(e)
{
	if (e.key === 'ArrowRight') rotateCarousel(1);
	else if (e.key === 'ArrowLeft') rotateCarousel(-1);
}

function handleResize()
{
	if (!carouselState) return;
	const container = document.getElementById('carousel-scene');
	if (!container) return;
	const w = container.clientWidth;
	carouselState.camera.aspect = w / 220;
	carouselState.camera.updateProjectionMatrix();
	carouselState.renderer.setSize(w, 220);
}

function goToCard(index)
{
	if (!carouselState || carouselState.currentIndex === index) return;
	carouselState.currentIndex = index;
	carouselState.targetRotation = -carouselState.theta * index;
	updateDots();
	updateCardVisibility();
	startCountAnimation(index);
}

function rotateCarousel(dir)
{
	if (!carouselState) return;
	const index = (carouselState.currentIndex + dir + carouselState.n) % carouselState.n;
	if (index === carouselState.currentIndex) return;
	carouselState.currentIndex = index;
	carouselState.targetRotation = -carouselState.theta * index;
	updateDots();
	updateCardVisibility();
	startCountAnimation(index);
}

function updateDots()
{
	document.querySelectorAll('.carousel-dot')
		.forEach((d, i) => d.classList.toggle('active', i === carouselState.currentIndex));
}

function updateCardVisibility()
{
	if (!carouselState) return;
	carouselState.cards.forEach((card, i) => card.material.opacity = i === carouselState.currentIndex ? 1 : 0.3);
}

function startCountAnimation(index)
{
	if (!carouselState) return;
	carouselState.animatingCard = index;
	carouselState.animationProgress = 0;
}

function animateCarousel()
{
	if (!carouselState) return;
	requestAnimationFrame(animateCarousel);
	carouselState.currentRotation += (carouselState.targetRotation - carouselState.currentRotation) * 0.08;
	carouselState.group.rotation.y = carouselState.currentRotation;
	if (carouselState.animatingCard >= 0)
	{
		carouselState.animationProgress += 0.02;
		if (carouselState.animationProgress >= 1)
		{
			carouselState.animationProgress = 1;
			carouselState.animatingCard = -1;
		}
		updateCardTexture(carouselState.cardData[carouselState.currentIndex], carouselState.animationProgress);
	}
	carouselState.renderer.render(carouselState.scene, carouselState.camera);
}

function createCardCanvas(data, index, progress)
{
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = 320;
	canvas.height = 240;
	drawCard(ctx, canvas, data, index, progress);
	const texture = new THREE.CanvasTexture(canvas);
	texture.anisotropy = 4;
	return {
		canvas,
		ctx,
		texture
	};
}

function updateCardTexture(cd, progress)
{
	drawCard(cd.ctx, cd.canvas, cd.data, cd.index, progress);
	cd.texture.needsUpdate = true;
}

function drawCard(ctx, canvas, data, index, progress)
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, 'rgba(26, 22, 37, 0.95)');
	gradient.addColorStop(1, 'rgba(36, 31, 49, 0.95)');
	ctx.fillStyle = gradient;
	roundRect(ctx, 0, 0, canvas.width, canvas.height, 20);
	ctx.fill();
	const colors = ['#a855f7', '#d946ef', '#8b5cf6', '#ec4899', '#a855f7', '#d946ef', '#8b5cf6'];
	ctx.strokeStyle = colors[index % colors.length];
	ctx.lineWidth = 3;
	roundRect(ctx, 2, 2, canvas.width - 4, canvas.height - 4, 18);
	ctx.stroke();
	const currentValue = Math.round(data.value * easeOutCubic(progress));
	const displayValue = (data.prefix || '') + currentValue + (data.suffix || '');
	const valueGradient = ctx.createLinearGradient(0, 60, canvas.width, 60);
	valueGradient.addColorStop(0, '#a855f7');
	valueGradient.addColorStop(1, '#d946ef');
	ctx.fillStyle = valueGradient;
	ctx.font = 'bold 3rem Space Grotesk, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(displayValue, canvas.width / 2, 100);
	ctx.fillStyle = '#f5f3ff';
	ctx.font = '600 1.125rem Space Grotesk, sans-serif';
	wrapText(ctx, data.label, canvas.width / 2, 145, canvas.width - 40, 24);
	ctx.fillStyle = '#6b6490';
	ctx.font = 'italic 0.875rem Space Grotesk, sans-serif';
	ctx.fillText('Source : ' + data.source, canvas.width / 2, 215);
}

function easeOutCubic(t)
{
	return 1 - Math.pow(1 - t, 3);
}

function roundRect(ctx, x, y, w, h, r)
{
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight)
{
	const words = text.split(' ');
	let line = '';
	for (let i = 0; i < words.length; i++)
	{
		const testLine = line + words[i] + ' ';
		if (ctx.measureText(testLine)
			.width > maxWidth && i > 0)
		{
			ctx.fillText(line.trim(), x, y);
			line = words[i] + ' ';
			y += lineHeight;
		}
		else line = testLine;
	}
	ctx.fillText(line.trim(), x, y);
}