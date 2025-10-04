// Stage 1 Team Detail Page (for Judges)
class Stage1TeamDetailPage {
  static render() {
    return `
            <div class="min-h-screen bg-gray-50">
                ${Navbar.render('Stage 1 Evaluation')}
                
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <!-- Header with Navigation -->
                    <div class="bg-white rounded-lg shadow mb-6">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center space-x-4">
                                    <button 
                                        onclick="router.navigate('/dashboard')"
                                        class="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                                    >
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>
                                    <h1 class="text-2xl font-bold text-gray-900" id="teamName">Loading...</h1>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <!-- Timer -->
                                    <div class="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-200">
                                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span id="timer" class="text-3xl font-mono font-bold text-blue-700">05:00</span>
                                    </div>
                                    <!-- Next Team Button -->
                                    <button 
                                        id="nextTeamBtn"
                                        onclick="Stage1TeamDetailPage.goToNextTeam()"
                                        class="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed transition-colors duration-200"
                                        disabled
                                        title="Please submit your score first"
                                    >
                                        Next Team
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Team Information -->
                        <div class="lg:col-span-1">
                            <div class="bg-white rounded-lg shadow">
                                <div class="px-6 py-4 border-b border-gray-200">
                                    <h2 class="text-lg font-medium text-gray-900">Team Information</h2>
                                </div>
                                <div class="p-6">
                                    <div id="teamInfo" class="space-y-4">
                                        <!-- Team info will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Scoring Form -->
                        <div class="lg:col-span-2">
                            <div class="bg-white rounded-lg shadow">
                                <div class="px-6 py-4 border-b border-gray-200">
                                    <div class="flex justify-between items-center">
                                        <h2 class="text-lg font-medium text-gray-900">Stage 1 Evaluation</h2>
                                        <button 
                                            id="submitScoreBtn"
                                            onclick="Stage1TeamDetailPage.submitScore(event)"
                                            class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                        >
                                            Submit Score
                                        </button>
                                    </div>
                                </div>
                                <div class="p-6">
                                    <div id="scoringForm" class="space-y-8">
                                        <!-- Scoring form will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static afterRender() {
    const teamId = Stage1TeamDetailPage.getTeamIdFromUrl();
    if (teamId) {
      Stage1TeamDetailPage.loadTeamData(teamId);
      Stage1TeamDetailPage.loadStageCriteria(teamId);
      Stage1TeamDetailPage.loadTimerSetting();
    }
  }

  static async loadTimerSetting() {
    try {
      const response = await fetch('/api/stages/Stage%201', {
        headers: { Authorization: `Bearer ${authService.token}` },
      });

      if (response.ok) {
        const stage = await response.json();
        const timerMinutes = stage.timerMinutes || 30;
        Stage1TeamDetailPage.startTimer(timerMinutes);
      } else {
        Stage1TeamDetailPage.startTimer(30);
      }
    } catch (error) {
      console.error('Failed to load timer setting:', error);
      Stage1TeamDetailPage.startTimer(30);
    }
  }

  static getTeamIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/stage1\/(.+)/);
    return match ? match[1] : null;
  }

  static async loadTeamData(teamId) {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const team = await response.json();
        Stage1TeamDetailPage.displayTeamInfo(team);
        window.currentTeam = team;
      } else {
        console.error('Failed to load team data');
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    }
  }

  static displayTeamInfo(team) {
    document.getElementById('teamName').textContent = team.name;

    const teamInfoContainer = document.getElementById('teamInfo');
    teamInfoContainer.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-gray-700">Team Name</label>
                <p class="mt-1 text-sm text-gray-900">${team.name}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Challenge</label>
                <p class="mt-1 text-sm text-gray-900">${team.challenge}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Solution Type</label>
                <p class="mt-1 text-sm text-gray-900">${team.actualSolution || '-'}</p>
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Links</label>
                ${team.demoLink ? `<a href="${team.demoLink}" target="_blank" class="block text-blue-600 hover:text-blue-900 text-sm">📺 Demo Link</a>` : '<p class="text-sm text-gray-400">No demo link</p>'}
                ${team.proposalLink ? `<a href="${team.proposalLink}" target="_blank" class="block text-blue-600 hover:text-blue-900 text-sm">📄 Proposal Link</a>` : '<p class="text-sm text-gray-400">No proposal link</p>'}
                ${team.projectLink ? `<a href="${team.projectLink}" target="_blank" class="block text-blue-600 hover:text-blue-900 text-sm">🚀 Project Link</a>` : '<p class="text-sm text-gray-400">No project link</p>'}
                ${team.nasaSubmitLink ? `<a href="${team.nasaSubmitLink}" target="_blank" class="block text-blue-600 hover:text-blue-900 text-sm">🌌 NASA Submit Link</a>` : '<p class="text-sm text-gray-400">No NASA submit link</p>'}
            </div>
        `;
  }

  static async loadStageCriteria(teamId) {
    try {
      const response = await fetch('/api/stages/Stage%201', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const stage = await response.json();
        window.stageCriteria = stage.criteria;
        Stage1TeamDetailPage.renderScoringForm(stage.criteria || []);

        setTimeout(async () => {
          await Stage1TeamDetailPage.loadPreviousScore(teamId);
        }, 100);
      } else {
        console.error('Failed to load stage criteria');
      }
    } catch (error) {
      console.error('Error loading stage criteria:', error);
    }
  }

  static async loadPreviousScore(teamId) {
    try {
      const judgeId = authService.getUserId();
      console.log(
        'Loading previous score for judge:',
        judgeId,
        'team:',
        teamId,
      );

      const response = await fetch(
        `/api/scores/judge/${judgeId}/team/${teamId}/stage/1`,
        {
          headers: {
            Authorization: `Bearer ${authService.token}`,
          },
        },
      );

      console.log('Response status:', response.status, 'ok:', response.ok);

      if (response.ok && response.status !== 204) {
        try {
          const score = await response.json();
          console.log('Previous score loaded:', score);

          if (score && score.scores) {
            window.stageCriteria.forEach((criterion, criterionIndex) => {
              const savedScores = score.scores[criterion.name];
              console.log(`Restoring ${criterion.name}:`, savedScores);

              if (savedScores && Array.isArray(savedScores)) {
                savedScores.forEach((value, questionIndex) => {
                  const checkboxId = `criterion_${criterionIndex}_question_${questionIndex}`;
                  const checkbox = document.getElementById(checkboxId);
                  console.log(
                    `Checkbox ${checkboxId}:`,
                    checkbox ? 'found' : 'NOT FOUND',
                    'value:',
                    value,
                  );

                  if (checkbox) {
                    checkbox.checked = value === 1;
                  }
                });
              }
            });
            Stage1TeamDetailPage.updateScore();
            // Enable Next Team button if score already exists
            Stage1TeamDetailPage.enableNextTeamButton();
            console.log('Score display updated');
          }
        } catch (jsonError) {
          console.log('JSON parse error:', jsonError);
        }
      } else {
        console.log('No previous score found (response not ok)');
      }
    } catch (error) {
      console.log('No previous score found or error loading:', error);
    }
  }

  static renderScoringForm(criteria) {
    const formContainer = document.getElementById('scoringForm');

    if (criteria.length === 0) {
      formContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-sm font-medium text-gray-900">No criteria configured</p>
                    <p class="text-sm text-gray-500">Please contact the administrator</p>
                </div>
            `;
      return;
    }

    formContainer.innerHTML =
      criteria
        .map(
          (criterion, criterionIndex) => `
            <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                    class="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onclick="Stage1TeamDetailPage.toggleCriterion(${criterionIndex})"
                >
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3">
                                <svg 
                                    id="arrow_${criterionIndex}" 
                                    class="w-5 h-5 text-gray-500 transform transition-transform duration-200"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                                <h3 class="text-lg font-medium text-gray-900">${criterion.name}</h3>
                            </div>
                            <p class="text-sm text-gray-500 ml-8 mt-1">${Array.isArray(criterion.questions) ? criterion.questions.length : criterion.questions} question(s)</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600">
                                <span class="font-medium">Score:</span> 
                                <span id="criterionScore_${criterionIndex}">0</span> / ${Array.isArray(criterion.questions) ? criterion.questions.length : criterion.questions}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div id="criterion_content_${criterionIndex}" class="hidden">
                    <div class="px-6 py-4 space-y-4 bg-white">
                        ${(Array.isArray(criterion.questions)
                          ? criterion.questions
                          : Array.from(
                              { length: criterion.questions },
                              (_, i) => `Question ${i + 1}`,
                            )
                        )
                          .map(
                            (question, questionIndex) => `
                            <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                                <input 
                                    type="checkbox" 
                                    id="criterion_${criterionIndex}_question_${questionIndex}"
                                    name="criterion_${criterionIndex}_question_${questionIndex}" 
                                    value="1"
                                    class="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    onchange="Stage1TeamDetailPage.updateScore()"
                                >
                                <label for="criterion_${criterionIndex}_question_${questionIndex}" class="flex-1 text-sm text-gray-700 cursor-pointer">
                                    ${question}
                                </label>
                            </div>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        `,
        )
        .join('') +
      `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium text-blue-900">Total Score</h3>
                    <div class="text-2xl font-bold text-blue-900">
                        <span id="totalScore">0.00</span> / <span id="maxScore">0.00</span>
                    </div>
                </div>
                <p class="text-sm text-blue-700 mt-2">
                    Final weighted score based on all criteria
                </p>
            </div>
        `;

    // Initialize the score display immediately after rendering
    Stage1TeamDetailPage.updateScore();
  }

  static toggleCriterion(index) {
    const content = document.getElementById(`criterion_content_${index}`);
    const arrow = document.getElementById(`arrow_${index}`);

    if (content && arrow) {
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.classList.add('rotate-90');
      } else {
        content.classList.add('hidden');
        arrow.classList.remove('rotate-90');
      }
    }
  }

  static updateScore() {
    if (!window.stageCriteria) return;

    let totalScore = 0;
    let maxPossibleScore = 0;
    const numCriteria = window.stageCriteria.length;

    window.stageCriteria.forEach((criterion, criterionIndex) => {
      let criterionScore = 0;
      const questionCount = Array.isArray(criterion.questions)
        ? criterion.questions.length
        : criterion.questions;

      for (
        let questionIndex = 0;
        questionIndex < questionCount;
        questionIndex++
      ) {
        const checkboxId = `criterion_${criterionIndex}_question_${questionIndex}`;
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && checkbox.checked) {
          criterionScore += 1;
        }
      }

      const weightedScore = criterionScore * criterion.weight;
      const maxWeightedScore = questionCount * criterion.weight;

      totalScore += weightedScore;
      maxPossibleScore += maxWeightedScore;

      // Update criterion score display
      const criterionScoreElement = document.getElementById(
        `criterionScore_${criterionIndex}`,
      );
      if (criterionScoreElement) {
        criterionScoreElement.textContent = criterionScore;
      }
    });

    // Normalize to 5-point scale
    const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 5 : 0;
    const maxNormalizedScore = 5.0;

    const totalScoreElement = document.getElementById('totalScore');
    const maxScoreElement = document.getElementById('maxScore');

    if (totalScoreElement) {
      totalScoreElement.textContent = normalizedScore.toFixed(2);
    }
    if (maxScoreElement) {
      maxScoreElement.textContent = maxNormalizedScore.toFixed(1);
    }
  }

  static startTimer(minutes = 30) {
    let timeLeft = minutes * 60;
    const timerElement = document.getElementById('timer');
    const timerContainer = timerElement.parentElement;

    const updateTimer = () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      timerElement.textContent = display;

      if (timeLeft <= 60) {
        timerElement.classList.remove('text-blue-700');
        timerElement.classList.add('text-red-600');
        timerContainer.classList.remove('bg-blue-50', 'border-blue-200');
        timerContainer.classList.add('bg-red-50', 'border-red-300');
        const svg = timerContainer.querySelector('svg');
        if (svg) {
          svg.classList.remove('text-blue-600');
          svg.classList.add('text-red-600');
        }
      }

      if (timeLeft > 0) {
        timeLeft--;
        setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  }

  static async submitScore(event) {
    if (!window.currentTeam || !window.stageCriteria) {
      alert('Missing team or criteria data');
      return;
    }

    const scores = {};

    window.stageCriteria.forEach((criterion, criterionIndex) => {
      scores[criterion.name] = [];
      const questionCount = Array.isArray(criterion.questions)
        ? criterion.questions.length
        : criterion.questions;

      for (
        let questionIndex = 0;
        questionIndex < questionCount;
        questionIndex++
      ) {
        const checkboxId = `criterion_${criterionIndex}_question_${questionIndex}`;
        const checkbox = document.getElementById(checkboxId);
        scores[criterion.name].push(checkbox && checkbox.checked ? 1 : 0);
      }
    });

    // Calculate total weighted score
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    window.stageCriteria.forEach((criterion) => {
      const criterionScores = scores[criterion.name];
      const criterionTotal = criterionScores.reduce(
        (sum, score) => sum + score,
        0,
      );
      const questionCount = Array.isArray(criterion.questions) 
        ? criterion.questions.length 
        : criterion.questions;
      
      totalScore += criterionTotal * criterion.weight;
      maxPossibleScore += questionCount * criterion.weight;
    });

    // Normalize to 5-point scale for backend consistency
    const finalScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 5 : 0;

    const criteriaScores = {};
    window.stageCriteria.forEach((criterion) => {
      const criterionScores = scores[criterion.name];
      criteriaScores[criterion.name] = criterionScores.reduce(
        (sum, score) => sum + score,
        0,
      );
    });

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.token}`,
        },
        body: JSON.stringify({
          teamId: window.currentTeam._id,
          stage: 1,
          scores: scores,
          totalScore: finalScore,
          criteriaScores: criteriaScores,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Score saved:', result);

        const submitBtn = event
          ? event.target
          : document.getElementById('submitScoreBtn');
        if (submitBtn) {
          const originalText = submitBtn.textContent;
          submitBtn.textContent = '✓ Score Saved!';
          submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
          submitBtn.classList.add('bg-green-700');
          submitBtn.disabled = true;

          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('bg-green-700');
            submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            submitBtn.disabled = false;
          }, 3000);
        }

        // Enable Next Team button after successful submission
        Stage1TeamDetailPage.enableNextTeamButton();

        alert(
          'Score submitted successfully! You can continue to the next team or review your scores.',
        );
      } else {
        const error = await response.text();
        console.error('Server error:', error);
        alert('Failed to submit score: ' + error);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    }
  }

  static enableNextTeamButton() {
    const nextTeamBtn = document.getElementById('nextTeamBtn');
    if (nextTeamBtn) {
      nextTeamBtn.disabled = false;
      nextTeamBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
      nextTeamBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      nextTeamBtn.removeAttribute('title');
    }
  }

  static disableNextTeamButton() {
    const nextTeamBtn = document.getElementById('nextTeamBtn');
    if (nextTeamBtn) {
      nextTeamBtn.disabled = true;
      nextTeamBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      nextTeamBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
      nextTeamBtn.setAttribute('title', 'Please submit your score first');
    }
  }

  static async goToNextTeam() {
    // Check if button is disabled
    const nextTeamBtn = document.getElementById('nextTeamBtn');
    if (nextTeamBtn && nextTeamBtn.disabled) {
      alert('Please submit your score before proceeding to the next team.');
      return;
    }

    try {
      const response = await fetch('/api/judges/assigned-teams', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const teams = data.stage1Teams || [];
        const currentTeamId = Stage1TeamDetailPage.getTeamIdFromUrl();

        const currentIndex = teams.findIndex((t) => t._id === currentTeamId);

        if (currentIndex !== -1 && currentIndex < teams.length - 1) {
          const nextTeam = teams[currentIndex + 1];
          router.navigate(`/stage1/${nextTeam._id}`);
        } else {
          alert('No more teams to evaluate. Returning to dashboard.');
          router.navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error navigating to next team:', error);
      router.navigate('/dashboard');
    }
  }
}
