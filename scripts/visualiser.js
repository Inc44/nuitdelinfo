const audioPlayer = document.getElementById('audioPlayer');
const canvas = document.getElementById('visualiser');
const ctx = canvas.getContext('2d');
let audioContext;
let analyser;
let dataArray;
let animationId;
let processor;
// Initialize Web Audio API using ScriptProcessorNode as workaround
function initAudio()
{
	try
	{
		if (audioContext && audioContext.state !== 'closed')
		{
			console.log('Audio context already initialized');
			return;
		}
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextClass)
		{
			console.error('Web Audio API not supported');
			return;
		}
		audioContext = new AudioContextClass();
		console.log('Audio context created');
		if (audioContext.state === 'suspended')
		{
			audioContext.resume()
				.then(() => console.log('Context resumed'));
		}
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		// Create a ScriptProcessorNode to capture audio data
		processor = audioContext.createScriptProcessor(4096, 1, 1);
		processor.onaudioprocess = function(e)
		{
			// Audio data is captured here
		};
		// Connect processor to analyser
		processor.connect(analyser);
		analyser.connect(audioContext.destination);
		dataArray = new Uint8Array(analyser.frequencyBinCount);
		console.log('Processor connected to analyser');
		// Try to connect audio element
		connectAudioElement();
	}
	catch (error)
	{
		console.error('Audio init error:', error);
	}
}
// Alternative: Try to use audio element with different approach
function connectAudioElement()
{
	try
	{
		const source = audioContext.createMediaElementSource(audioPlayer);
		source.connect(analyser);
		analyser.connect(audioContext.destination);
		console.log('Audio element connected to analyser');
	}
	catch (err)
	{
		console.error('Could not connect audio element:', err);
	}
}
// Draw bars on canvas
function draw()
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	if (!analyser) return;
	analyser.getByteFrequencyData(dataArray);
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	let x = 0;
	let max_non_zero = dataArray.length;
	for (let i = 0; i < dataArray.length; i++)
	{
		if (dataArray[dataArray.length - 1 - i] <= 1)
		{
			max_non_zero = dataArray.length - 1 - i;
		}
		else
		{
			break;
		}
	}
	const barWidth = canvas.height / max_non_zero;
	let accuracy = 100;
	for (let i = 0; i < max_non_zero * accuracy; i++)
	{
		const ni = Math.floor(i / accuracy);
		const t = (i % accuracy) / accuracy;
		const interpolatedValue = lerp(dataArray[ni], dataArray[Math.min(ni + 1, max_non_zero - 1)], t);
		const barHeight = (interpolatedValue / 255) * canvas.height;
		const hue = 'rgb(167, 139, 250)';
		ctx.fillStyle = hue;
		ctx.fillRect(canvas.width - barHeight, x, barHeight, barWidth / accuracy);
		ctx.fillRect(0, x, barHeight, barWidth / accuracy);
		x += barWidth / accuracy;
	}
	applyPageFilterFromFFT(dataArray);
	animationId = requestAnimationFrame(draw);
}
//PEut etre un autre lerp ??? 
function lerp(a, b, t)
{
	return a + (b - a) * t;
}
// Initialize visualizer controls after components are loaded
function initVisualizer()
{
	const startBtn = document.getElementById('startBtn');
	const stopBtn = document.getElementById('stopBtn');
	if (!startBtn || !stopBtn) return;
	// Start visualizer
	startBtn.addEventListener('click', () =>
	{
		console.log('Start clicked');
		initAudio();
		canvas.style.visibility = 'visible';
		setTimeout(() =>
		{
			if (audioContext)
			{
				audioPlayer.play()
					.catch(err => console.error('Play error:', err));
				draw();
			}
		}, 150);
	});
	// Stop visualizer
	stopBtn.addEventListener('click', () =>
	{
		console.log('Stop clicked');
		audioPlayer.pause();
		if (animationId)
		{
			cancelAnimationFrame(animationId);
		}
		ctx.fillStyle = '#000000';
		canvas.style.visibility = 'hidden';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		document.body.style.filter = '';
	});
}

function applyPageFilterFromFFT(dataArray)
{
	// Compute average magnitude
	let sum = 0;
	for (let i = 0; i < dataArray.length; i++)
	{
		sum += dataArray[i];
	}
	const avg = sum / dataArray.length;
	const level = avg / 255;
	// Bass energy (first N bins)
	let bassSum = 0;
	const bassBins = 16;
	for (let i = 0; i < bassBins; i++)
	{
		bassSum += dataArray[i];
	}
	const bass = (bassSum / bassBins) / 255;
	// Map to filter parameters
	const hue = level * 40;
	const brightness = 1 + level * 0.2;
	const saturate = 1 + level * 0.5;
	document.body.style.filter = `hue-rotate(${hue}deg) ` + `brightness(${brightness}) ` + `saturate(${saturate}) `;
}