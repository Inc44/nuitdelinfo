async function loadComponent(id, path)
{
	try
	{
		const response = await fetch(path);
		if (!response.ok) throw new Error(`Failed to load ${path}`);
		const html = await response.text();
		document.getElementById(id)
			.innerHTML = html;
	}
	catch (error)
	{
		console.error(error);
	}
}
async function loadAllComponents()
{
	const components = [
		['nav-slot', 'components/nav.html'],
		['hero-slot', 'components/hero.html'],
		['stats-slot', 'components/stats.html'],
		['pillars-slot', 'components/pillars.html'],
		['quiz-slot', 'components/quiz.html'],
		['roadmap-slot', 'components/roadmap.html'],
		['resources-slot', 'components/resources.html'],
		['cta-slot', 'components/cta.html'],
		['footer-slot', 'components/footer.html'],
		['chatbot-slot', 'components/chatbot.html']
	];
	for (const [id, path] of components)
	{
		await loadComponent(id, path);
	}
	new PureCounter();
	if (typeof initQuiz === 'function') initQuiz();
	if (typeof initChatbot === 'function') initChatbot();
	if (typeof initVisualizer === 'function') initVisualizer();
}
document.addEventListener('DOMContentLoaded', loadAllComponents);