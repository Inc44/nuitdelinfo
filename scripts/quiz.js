/**
 * ============================================================================
 * QUIZ NIRD - AVEC FAILLE DE SÉCURITÉ ÉDUCATIVE
 * ============================================================================
 * 
 * 🎓 FAILLE : Stockage client non sécurisé (localStorage)
 * 
 * Les scores sont stockés côté client sans vérification serveur.
 * Un utilisateur peut modifier localStorage pour :
 * - Obtenir un score parfait sans répondre correctement
 * - Débloquer du contenu "secret" réservé aux experts
 * 
 * 💡 Pour trouver la faille : F12 → Application → Local Storage
 * 💡 Tapez showHint() dans la console pour des indices
 * 
 * ============================================================================
 */
const quizData = [
{
	question: "Que signifie NIRD ?",
	options: ["Numérique Inclusif Responsable Durable", "Nouveau Internet Rapide et Décentralisé", "Norme Internationale de Recyclage Digital", "Network of Independent Research Domains"],
	correct: 0
},
{
	question: "Quelle est la principale menace pour les PC des écoles en 2025 ?",
	options: ["Les virus informatiques", "La fin du support de Windows 10", "Le manque de connexion internet", "Les coupures électriques"],
	correct: 1
},
{
	question: "Quel système d'exploitation libre permet de prolonger la vie des ordinateurs ?",
	options: ["Windows 11", "macOS", "Linux", "ChromeOS"],
	correct: 2
},
{
	question: "Où est né le projet NIRD ?",
	options: ["Lycée Henri IV, Paris", "Lycée Carnot, Bruay-la-Buissière", "Université de Bordeaux", "École Polytechnique"],
	correct: 1
},
{
	question: "Quel est l'avantage principal des logiciels libres pour l'éducation ?",
	options: ["Ils sont plus beaux", "Transparence, souveraineté et gratuité", "Ils sont plus lents mais plus sûrs", "Ils nécessitent moins de RAM"],
	correct: 1
}];
let currentQuestion = 0;
let score = 0;
// ============================================================================
// SYSTÈME DE BADGES (VULNÉRABLE)
// ============================================================================
const BADGES = {
	beginner:
	{
		name: "Curieux du Libre",
		icon: "🌱",
		minScore: 1
	},
	intermediate:
	{
		name: "Apprenti Libriste",
		icon: "🐧",
		minScore: 3
	},
	expert:
	{
		name: "Maître du Libre",
		icon: "🏆",
		minScore: 5
	}
};
const SECRET_REWARD = {
	code: "NIRD-LIBRE-2025",
	discount: "50% sur la formation Linux",
	videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
};
/**
 * ⚠️ VULNÉRABLE : Sauvegarde le score dans localStorage sans protection
 */
function saveScore()
{
	const data = {
		score: score,
		total: quizData.length,
		date: new Date()
			.toISOString(),
		badges: []
	};
	// Calcul des badges
	if (score >= BADGES.beginner.minScore) data.badges.push("beginner");
	if (score >= BADGES.intermediate.minScore) data.badges.push("intermediate");
	if (score >= BADGES.expert.minScore) data.badges.push("expert");
	// ❌ VULNÉRABLE : Stockage direct sans signature ni vérification
	localStorage.setItem('nird_quiz_results', JSON.stringify(data));
}
/**
 * ⚠️ VULNÉRABLE : Charge les résultats sans vérification
 */
function loadSavedResults()
{
	try
	{
		const saved = localStorage.getItem('nird_quiz_results');
		return saved ? JSON.parse(saved) : null;
	}
	catch (e)
	{
		return null;
	}
}
/**
 * ⚠️ VULNÉRABLE : Vérifie l'accès au contenu secret via données client
 */
function hasExpertBadge()
{
	const results = loadSavedResults();
	// ❌ On fait confiance aux données du localStorage !
	return results && results.badges && results.badges.includes("expert");
}
// ============================================================================
// FONCTIONS DU QUIZ (ORIGINALES + MODIFICATIONS)
// ============================================================================
function initQuiz()
{
	const progress = document.getElementById('quiz-progress');
	if (!progress) return;
	progress.innerHTML = '';
	for (let i = 0; i < quizData.length; i++)
	{
		const pip = document.createElement('div');
		pip.className = 'progress-pip' + (i === 0 ? ' active' : '');
		progress.appendChild(pip);
	}
	showQuestion();
	createBadgesSection();
	updateBadgesDisplay();
}

function showQuestion()
{
	const q = quizData[currentQuestion];
	document.getElementById('quiz-title')
		.textContent = `Question ${currentQuestion + 1}/${quizData.length}`;
	document.getElementById('quiz-question')
		.textContent = q.question;
	document.getElementById('quiz-result')
		.style.display = 'none';
	const container = document.getElementById('quiz-options');
	container.innerHTML = '';
	q.options.forEach((opt, i) =>
	{
		const btn = document.createElement('button');
		btn.className = 'quiz-option';
		btn.textContent = opt;
		btn.onclick = () => selectAnswer(i);
		container.appendChild(btn);
	});
	const pips = document.querySelectorAll('.progress-pip');
	pips.forEach((pip, i) =>
	{
		pip.classList.remove('active');
		if (i === currentQuestion) pip.classList.add('active');
	});
}

function selectAnswer(index)
{
	const q = quizData[currentQuestion];
	const options = document.querySelectorAll('.quiz-option');
	const result = document.getElementById('quiz-result');
	options.forEach((opt, i) =>
	{
		opt.style.pointerEvents = 'none';
		if (i === q.correct) opt.classList.add('correct');
		else if (i === index && i !== q.correct) opt.classList.add('wrong');
	});
	if (index === q.correct)
	{
		score++;
		result.textContent = '✓ Correct !';
		result.style.background = 'rgba(163, 230, 53, 0.15)';
		result.style.color = '#a3e635';
	}
	else
	{
		result.textContent = '✗ Incorrect';
		result.style.background = 'rgba(248, 113, 113, 0.15)';
		result.style.color = '#f87171';
	}
	result.style.display = 'block';
	document.querySelectorAll('.progress-pip')[currentQuestion].classList.add('done');
	setTimeout(() =>
	{
		currentQuestion++;
		if (currentQuestion < quizData.length)
		{
			showQuestion();
		}
		else
		{
			showFinalResult();
		}
	}, 1400);
}

function showFinalResult()
{
	document.getElementById('quiz-title')
		.textContent = 'Résultat Final';
	document.getElementById('quiz-question')
		.textContent = `Score : ${score}/${quizData.length}`;
	document.getElementById('quiz-options')
		.innerHTML = '';
	const result = document.getElementById('quiz-result');
	let message;
	if (score === quizData.length)
	{
		message = '🏆 Parfait ! Vous êtes prêt à rejoindre la résistance !';
		result.style.background = 'rgba(163, 230, 53, 0.15)';
		result.style.color = '#a3e635';
	}
	else if (score >= 3)
	{
		message = '👍 Bien joué ! Quelques révisions et ce sera parfait.';
		result.style.background = 'rgba(251, 191, 36, 0.15)';
		result.style.color = '#fbbf24';
	}
	else
	{
		message = '📚 Explorez le site pour en apprendre plus sur NIRD !';
		result.style.background = 'rgba(236, 72, 153, 0.15)';
		result.style.color = '#ec4899';
	}
	result.textContent = message;
	result.style.display = 'block';
	// Sauvegarder le score (VULNÉRABLE)
	saveScore();
	updateBadgesDisplay();
	// Bouton recommencer
	const restart = document.createElement('button');
	restart.className = 'btn btn-secondary';
	restart.textContent = 'Recommencer';
	restart.style.marginTop = '20px';
	restart.onclick = () =>
	{
		currentQuestion = 0;
		score = 0;
		initQuiz();
	};
	document.getElementById('quiz-options')
		.appendChild(restart);
}
// ============================================================================
// INTERFACE DES BADGES
// ============================================================================
function createBadgesSection()
{
	if (document.getElementById('badges-section')) return;
	const quizSection = document.getElementById('quiz');
	if (!quizSection) return;
	const badgesHTML = `
        <div id="badges-section" style="max-width: 45rem; margin: 2rem auto 0;">
            <div class="pillar-card">
                <div class="pillar-icon">🏅</div>
                <h3>Mes Badges</h3>
                <div id="badges-container" style="margin-top: 1rem;"></div>
            </div>
            
            <div id="secret-panel" class="pillar-card" style="display: none; margin-top: 1rem; border-color: #a3e635; background: rgba(163, 230, 53, 0.05);">
                <div class="pillar-icon">🎉</div>
                <h3>Contenu Secret Débloqué !</h3>
                <p style="margin: 1rem 0;">Félicitations ! Voici votre récompense exclusive :</p>
                <div style="background: var(--bg-void); padding: 1rem; border-radius: 8px;">
                    <p><strong>🎁 Code :</strong> <code style="background: linear-gradient(135deg, #a855f7, #d946ef); padding: 0.3rem 0.8rem; border-radius: 4px; color: white;">${SECRET_REWARD.code}</code></p>
                    <p style="color: #a3e635; margin-top: 0.5rem;">${SECRET_REWARD.discount}</p>
                </div>
                <a href="${SECRET_REWARD.videoUrl}" target="_blank" class="btn btn-primary" style="margin-top: 1rem;">🎬 Vidéo Exclusive</a>
            </div>
            
            <p style="text-align: center; margin-top: 1rem; font-size: 0.75rem; color: #6b6490;">
                💡 Indice : F12 → Application → Local Storage
            </p>
        </div>
    `;
	// Ajouter les styles
	if (!document.getElementById('badges-styles'))
	{
		const style = document.createElement('style');
		style.id = 'badges-styles';
		style.textContent = `
            .badges-grid { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
            .badge-item { text-align: center; padding: 1rem 1.5rem; border-radius: 8px; background: #24203a; border: 1px solid #3d3554; min-width: 120px; }
            .badge-item.earned { border-color: #a855f7; background: rgba(168, 85, 247, 0.15); }
            .badge-item.locked { opacity: 0.4; }
            .badge-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
            .badge-name { font-size: 0.8rem; font-weight: 600; display: block; }
        `;
		document.head.appendChild(style);
	}
	const container = quizSection.querySelector('.container');
	if (container)
	{
		container.insertAdjacentHTML('beforeend', badgesHTML);
	}
}

function updateBadgesDisplay()
{
	const container = document.getElementById('badges-container');
	const secretPanel = document.getElementById('secret-panel');
	if (!container) return;
	const results = loadSavedResults();
	const earnedBadges = results?.badges || [];
	let html = '<div class="badges-grid">';
	Object.entries(BADGES)
		.forEach(([id, badge]) =>
		{
			const isEarned = earnedBadges.includes(id);
			html += `
            <div class="badge-item ${isEarned ? 'earned' : 'locked'}">
                <span class="badge-icon">${isEarned ? badge.icon : '🔒'}</span>
                <span class="badge-name">${badge.name}</span>
            </div>
        `;
		});
	html += '</div>';
	if (results)
	{
		html += `<p style="text-align: center; margin-top: 1rem; color: #a855f7;">Score : ${results.score}/${results.total}</p>`;
	}
	container.innerHTML = html;
	// Afficher contenu secret si badge expert
	if (secretPanel && hasExpertBadge())
	{
		secretPanel.style.display = 'block';
	}
}
// ============================================================================
// FONCTIONS D'AIDE (CONSOLE)
// ============================================================================
window.showHint = function()
{
	console.log(`
    💡 INDICE : Regardez dans localStorage...
    
    F12 → Application → Local Storage → nird_quiz_results
    
    Tapez showSolution() pour la réponse complète.
    `);
};
window.showSolution = function()
{
	console.log(`
    🔓 SOLUTION :
    
    Collez ceci dans la console :
    
    localStorage.setItem('nird_quiz_results', JSON.stringify({
        score: 5,
        total: 5,
        date: new Date().toISOString(),
        badges: ["beginner", "intermediate", "expert"]
    }));
    
    Puis rafraîchissez la page (F5) !
    
    ───────────────────────────────
    
    🛡️ PROTECTION : Toujours valider les scores côté SERVEUR,
    jamais faire confiance au localStorage pour des données sensibles.
    `);
};
// ============================================================================
// INITIALISATION
// ============================================================================
document.addEventListener('DOMContentLoaded', initQuiz);