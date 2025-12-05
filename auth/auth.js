const MIN_TAPS = 8;
const MAX_TAPS = 16;
const TOLERANCE = 0.15;
let mode = 'login';
let taps = [];
let lastTapTime = 0;
const rhythmZone = document.getElementById('rhythm-zone');
const rhythmVisualizer = document.getElementById('rhythm-visualizer');
const tapCountEl = document.getElementById('tap-count');
const tapTargetEl = document.getElementById('tap-target');
const instructionEl = document.getElementById('rhythm-instruction');
const btnReset = document.getElementById('btn-reset');
const btnSubmit = document.getElementById('btn-submit');
const feedback = document.getElementById('feedback');
const usernameInput = document.getElementById('username');
const tabBtns = document.querySelectorAll('.tab-btn');

function init()
{
	tapTargetEl.textContent = MIN_TAPS;
	tabBtns.forEach(btn =>
	{
		btn.addEventListener('click', () => switchMode(btn.dataset.mode));
	});
	rhythmZone.addEventListener('click', recordTap);
	rhythmZone.addEventListener('touchstart', e =>
	{
		e.preventDefault();
		recordTap();
	});
	document.addEventListener('keydown', e =>
	{
		if (e.code === 'Space' && document.activeElement !== usernameInput)
		{
			e.preventDefault();
			recordTap();
		}
	});
	btnReset.addEventListener('click', resetRhythm);
	btnSubmit.addEventListener('click', submitRhythm);
}

function switchMode(newMode)
{
	mode = newMode;
	tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
	btnSubmit.textContent = mode === 'login' ? 'Vérifier le rythme' : 'Enregistrer le rythme';
	resetRhythm();
	hideFeedback();
}

function recordTap()
{
	if (taps.length >= MAX_TAPS) return;
	const now = performance.now();
	if (taps.length > 0)
	{
		const interval = now - lastTapTime;
		taps.push(interval);
	}
	else
	{
		taps.push(0);
	}
	lastTapTime = now;
	rhythmZone.classList.add('tapped');
	setTimeout(() => rhythmZone.classList.remove('tapped'), 150);
	updateVisualizer();
	updateCounter();
	updateSubmitButton();
}

function updateVisualizer()
{
	rhythmVisualizer.innerHTML = '';
	const intervals = taps.slice(1);
	if (intervals.length === 0)
	{
		const bar = document.createElement('div');
		bar.className = 'rhythm-bar';
		bar.style.height = '1rem';
		rhythmVisualizer.appendChild(bar);
		return;
	}
	const maxInterval = Math.max(...intervals, 1);
	intervals.forEach(interval =>
	{
		const bar = document.createElement('div');
		bar.className = 'rhythm-bar';
		const height = Math.max(0.5, (interval / maxInterval) * 2.5);
		bar.style.height = height + 'rem';
		rhythmVisualizer.appendChild(bar);
	});
}

function updateCounter()
{
	tapCountEl.textContent = taps.length;
	if (taps.length >= MIN_TAPS)
	{
		instructionEl.textContent = taps.length >= MAX_TAPS ? 'Maximum atteint' : 'Continuez ou validez';
	}
	else
	{
		const remaining = MIN_TAPS - taps.length;
		instructionEl.textContent = `Encore ${remaining} tap${remaining > 1 ? 's' : ''}`;
	}
}

function updateSubmitButton()
{
	btnSubmit.disabled = taps.length < MIN_TAPS || usernameInput.value.trim()
		.length < 2;
}

function resetRhythm()
{
	taps = [];
	lastTapTime = 0;
	rhythmVisualizer.innerHTML = '';
	tapCountEl.textContent = '0';
	instructionEl.textContent = 'Cliquez ou appuyez sur Espace';
	updateSubmitButton();
}

function hideFeedback()
{
	feedback.className = 'auth-feedback';
	feedback.textContent = '';
}

function showFeedback(message, isSuccess)
{
	feedback.className = 'auth-feedback ' + (isSuccess ? 'success' : 'error');
	feedback.textContent = message;
}
async function submitRhythm()
{
	const username = usernameInput.value.trim();
	if (username.length < 2)
	{
		showFeedback('Identifiant trop court', false);
		return;
	}
	if (taps.length < MIN_TAPS)
	{
		showFeedback('Rythme trop court', false);
		return;
	}
	const intervals = taps.slice(1);
	const normalizedPattern = normalizePattern(intervals);
	btnSubmit.disabled = true;
	btnSubmit.textContent = 'Vérification...';
	try
	{
		const response = await fetch('auth.php',
		{
			method: 'POST',
			headers:
			{
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
			{
				action: mode,
				username: username,
				pattern: normalizedPattern
			})
		});
		const result = await response.json();
		if (result.success)
		{
			showFeedback(result.message, true);
			if (mode === 'login')
			{
				setTimeout(() =>
				{
					window.location.href = '../index.html';
				}, 1500);
			}
			else
			{
				setTimeout(() => switchMode('login'), 2000);
			}
		}
		else
		{
			showFeedback(result.message, false);
		}
	}
	catch (err)
	{
		showFeedback('Erreur de connexion', false);
	}
	btnSubmit.disabled = false;
	btnSubmit.textContent = mode === 'login' ? 'Vérifier le rythme' : 'Enregistrer le rythme';
}

function normalizePattern(intervals)
{
	if (intervals.length === 0) return [];
	const total = intervals.reduce((a, b) => a + b, 0);
	return intervals.map(i => Math.round((i / total) * 1000));
}
usernameInput.addEventListener('input', updateSubmitButton);
init();