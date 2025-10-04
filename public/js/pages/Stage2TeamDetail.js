// ============================================
// Stage 2 Team Detail Page (for Judges)
// ============================================
class Stage2TeamDetailPage {
    static render() {
      return `
              <div class="min-h-screen bg-gray-50">
                  ${Navbar.render('Stage 2 Evaluation')}
                  
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
                                      <div>
                                          <h1 class="text-2xl font-bold text-gray-900" id="teamName">Loading...</h1>
                                          <p class="text-sm text-blue-600 font-medium" id="awardType"></p>
                                      </div>
                                  </div>
                                  <div class="flex items-center space-x-4">
                                      <!-- Timer -->
                                      <div class="flex items-center space-x-3 bg-purple-50 px-4 py-2 rounded-lg border-2 border-purple-200">
                                          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                          </svg>
                                          <span id="timer" class="text-3xl font-mono font-bold text-purple-700">30:00</span>
                                      </div>
                                      <button 
                                          id="submitScoreBtn"
                                          onclick="Stage2TeamDetailPage.submitScore(event)"
                                          class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                      >
                                          Submit Score
                                      </button>
                                      <button 
                                          id="nextTeamBtn"
                                          onclick="Stage2TeamDetailPage.goToNextTeam()"
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
                                      <h2 class="text-lg font-medium text-gray-900">Stage 2 Evaluation</h2>
                                  </div>
                                  <div class="p-6">
                                      <div id="scoringForm" class="space-y-6">
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
      const teamId = Stage2TeamDetailPage.getTeamIdFromUrl();
      if (teamId) {
        Stage2TeamDetailPage.loadTeamData(teamId);
        Stage2TeamDetailPage.loadAwardCriteria(teamId);
        Stage2TeamDetailPage.loadTimerSetting();
      }
    }
  
    static async loadTimerSetting() {
      try {
        const response = await fetch('/api/stages/Stage%202', {
          headers: { Authorization: `Bearer ${authService.token}` },
        });
  
        if (response.ok) {
          const stage = await response.json();
          const timerMinutes = stage.timerMinutes || 30;
          Stage2TeamDetailPage.startTimer(timerMinutes);
        } else {
          Stage2TeamDetailPage.startTimer(30); // Default 30 minutes
        }
      } catch (error) {
        console.error('Failed to load timer setting:', error);
        Stage2TeamDetailPage.startTimer(30); // Default 30 minutes
      }
    }
  
    static getTeamIdFromUrl() {
      const path = window.location.pathname;
      const match = path.match(/\/stage2\/(.+)/);
      return match ? match[1] : null;
    }
  
    static async loadTeamData(teamId) {
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${authService.token}` },
        });
  
        if (response.ok) {
          const team = await response.json();
          Stage2TeamDetailPage.displayTeamInfo(team);
          window.currentTeam = team;
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
  
    static async loadAwardCriteria(teamId) {
      try {
        // Get judge's panel assignment
        const judgeResponse = await fetch('/api/judges/assigned-teams', {
          headers: { Authorization: `Bearer ${authService.token}` },
        });
  
        if (!judgeResponse.ok) return;
  
        const judgeData = await judgeResponse.json();
        const awardType = judgeData.stage2AwardType;
  
        if (!awardType) {
          alert('No Stage 2 panel assignment found');
          return;
        }
  
        document.getElementById('awardType').textContent = `Award: ${awardType}`;
  
        // Load criteria for this award
        const response = await fetch('/api/stages/Stage%202', {
          headers: { Authorization: `Bearer ${authService.token}` },
        });
  
        if (response.ok) {
          const stage = await response.json();
          const awardCriteria = stage.criteria.find((c) => c.name === awardType);
  
          if (awardCriteria) {
            window.awardCriteria = awardCriteria;
            window.awardType = awardType;
            Stage2TeamDetailPage.renderScoringForm(awardCriteria);
  
            setTimeout(async () => {
              await Stage2TeamDetailPage.loadPreviousScore(teamId);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error loading award criteria:', error);
      }
    }
  
    static async loadPreviousScore(teamId) {
      try {
        const judgeId = authService.getUserId();
        const response = await fetch(
          `/api/scores/judge/${judgeId}/team/${teamId}/stage/2`,
          {
            headers: { Authorization: `Bearer ${authService.token}` },
          },
        );
  
        if (response.ok && response.status !== 204) {
          const score = await response.json();
          if (score && score.scores) {
            // Restore radio buttons
            score.scores[window.awardType]?.forEach((value, qIndex) => {
              const radioId = `q${qIndex}_${value}`;
              const radio = document.getElementById(radioId);
              if (radio) radio.checked = true;
            });
            Stage2TeamDetailPage.updateScore();
            // Enable Next Team button if score already exists
            Stage2TeamDetailPage.enableNextTeamButton();
          }
        }
        console.log('No previous score found');
      } catch (error) {
        console.error('Error loading previous score:', error);
      }
    }
  
    static renderScoringForm(criteria) {
      const formContainer = document.getElementById('scoringForm');
  
      formContainer.innerHTML =
        criteria.questions
          .map(
            (question, qIndex) => `
              <div class="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                  <label class="block text-base font-semibold text-gray-900 mb-4">${qIndex + 1}. ${question}</label>
                  
                  <div class="space-y-2">
                      ${[1, 2, 3, 4, 5]
                        .map((score) => {
                          const descriptions =
                            criteria.scoringDescriptions &&
                            criteria.scoringDescriptions[qIndex];
                          const description = descriptions
                            ? descriptions[`score${score}`]
                            : '';
                          return `
                              <label class="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                                  <input 
                                      type="radio" 
                                      name="question_${qIndex}" 
                                      id="q${qIndex}_${score}"
                                      value="${score}"
                                      onchange="Stage2TeamDetailPage.updateScore()"
                                      class="mt-1 h-4 w-4 text-blue-600"
                                  >
                                  <div class="flex-1">
                                      <div class="flex items-center space-x-2">
                                          <span class="text-sm font-bold text-blue-600">${score}</span>
                                          ${description ? `<span class="text-sm text-gray-700">${description}</span>` : `<span class="text-sm text-gray-400 italic">Score ${score}</span>`}
                                      </div>
                                  </div>
                              </label>
                          `;
                        })
                        .join('')}
                  </div>
              </div>
          `,
          )
          .join('') +
        `
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div class="flex justify-between items-center">
                      <h3 class="text-lg font-medium text-blue-900">Average Score</h3>
                      <div class="text-2xl font-bold text-blue-900">
                          <span id="averageScore">0.00</span> / 5.00
                      </div>
                  </div>
              </div>
          `;
    }
  
    static updateScore() {
      if (!window.awardCriteria) return;
  
      let total = 0;
      let count = 0;
  
      window.awardCriteria.questions.forEach((_, qIndex) => {
        const selected = document.querySelector(
          `input[name="question_${qIndex}"]:checked`,
        );
        if (selected) {
          total += parseInt(selected.value);
          count++;
        }
      });
  
      const average = count > 0 ? (total / count).toFixed(2) : '0.00';
      document.getElementById('averageScore').textContent = average;
    }
  
    static async submitScore(event) {
      if (!window.currentTeam || !window.awardCriteria) {
        alert('Missing team or criteria data');
        return;
      }
  
      const scores = [];
      let allAnswered = true;
  
      window.awardCriteria.questions.forEach((_, qIndex) => {
        const selected = document.querySelector(
          `input[name="question_${qIndex}"]:checked`,
        );
        if (selected) {
          scores.push(parseInt(selected.value));
        } else {
          allAnswered = false;
        }
      });
  
      if (!allAnswered) {
        alert('Please answer all questions before submitting');
        return;
      }
  
      const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  
      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.token}`,
          },
          body: JSON.stringify({
            teamId: window.currentTeam._id,
            stage: 2,
            scores: { [window.awardType]: scores },
            totalScore: averageScore,
            awardType: window.awardType,
          }),
        });
  
        if (response.ok) {
          const submitBtn = event.target;
          submitBtn.textContent = '✓ Score Saved!';
          submitBtn.classList.add('bg-green-700');
          submitBtn.disabled = true;
  
          // Enable Next Team button after successful submission
          Stage2TeamDetailPage.enableNextTeamButton();
  
          setTimeout(() => {
            submitBtn.textContent = 'Submit Score';
            submitBtn.classList.remove('bg-green-700');
            submitBtn.disabled = false;
          }, 3000);
        }
      } catch (error) {
        console.error('Error submitting score:', error);
        alert('Failed to submit score');
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
          headers: { Authorization: `Bearer ${authService.token}` },
        });
  
        if (response.ok) {
          const data = await response.json();
          const teams = data.stage2Teams || [];
          const currentTeamId = Stage2TeamDetailPage.getTeamIdFromUrl();
          const currentIndex = teams.findIndex((t) => t._id === currentTeamId);
  
          if (currentIndex !== -1 && currentIndex < teams.length - 1) {
            router.navigate(`/stage2/${teams[currentIndex + 1]._id}`);
          } else {
            alert('No more teams. Returning to dashboard.');
            router.navigate('/dashboard');
          }
        }
      } catch (error) {
        router.navigate('/dashboard');
      }
    }
  
    static startTimer(minutes = 30) {
      let timeLeft = minutes * 60; // Convert minutes to seconds
      const timerElement = document.getElementById('timer');
      const timerContainer = timerElement.parentElement;
  
      const updateTimer = () => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
        timerElement.textContent = display;
  
        // Change color based on time remaining
        if (timeLeft <= 60) {
          timerContainer.classList.remove('bg-purple-50', 'border-purple-200');
          timerContainer.classList.add('bg-red-50', 'border-red-200');
          timerElement.classList.remove('text-purple-700');
          timerElement.classList.add('text-red-700');
        } else if (timeLeft <= 300) {
          timerContainer.classList.remove('bg-purple-50', 'border-purple-200');
          timerContainer.classList.add('bg-yellow-50', 'border-yellow-200');
          timerElement.classList.remove('text-purple-700');
          timerElement.classList.add('text-yellow-700');
        }
  
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          timerElement.textContent = '00:00';
          alert('Time is up! Please submit your score.');
        }
  
        timeLeft--;
      };
  
      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
    }
  }