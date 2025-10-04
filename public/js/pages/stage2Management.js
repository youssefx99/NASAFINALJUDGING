// Stage 2 Management Page - 10 Award-Specific Criteria
class Stage2ManagementPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <h1 class="text-2xl font-bold text-gray-900">Stage 2 Award Criteria Management</h1>
                        <p class="text-sm text-gray-600 mt-1">Manage criteria for each of the 10 award categories</p>
                    </div>
                     
                    <div class="p-6 space-y-6">
                        <!-- Timer Configuration -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-medium text-gray-900">Timer Configuration</h2>
                            </div>
                            <div class="p-6">
                                <div class="flex items-center space-x-4">
                                    <label class="text-sm font-medium text-gray-700">Judging Time Limit (minutes):</label>
                                    <input 
                                        type="number" 
                                        id="timerMinutes" 
                                        min="1" 
                                        max="180"
                                        value="30"
                                        class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span class="text-sm text-gray-500">minutes per team</span>
                                    <button 
                                        onclick="Stage2ManagementPage.saveTimer()"
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Save Timer
                                    </button>
                                </div>
                                <p class="mt-2 text-xs text-gray-500">This timer will be displayed to judges when scoring teams in Stage 2.</p>
                            </div>
                        </div>

                        <!-- Award Criteria -->
                        <div id="awardCriteriaList" class="space-y-6">
                            <!-- Award criteria will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Modal -->
            <div id="editAwardModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 id="modalAwardTitle" class="text-lg font-medium text-gray-900"></h3>
                        </div>
                        <div class="p-6">
                            <div id="editQuestionsForm" class="space-y-4">
                                <!-- Questions will be loaded here -->
                            </div>
                            <div class="flex justify-end space-x-3 pt-4 border-t">
                                <button 
                                    onclick="Stage2ManagementPage.closeEditModal()"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onclick="Stage2ManagementPage.saveAwardCriteria()"
                                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        Stage2ManagementPage.loadAwardCriteria();
    }

    static async loadAwardCriteria() {
        try {
            const response = await fetch('/api/stages/Stage%202', {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            });
            
            if (response.ok) {
                const stage = await response.json();
                window.stage2Awards = stage.criteria || [];
                // Load timer setting
                if (stage.timerMinutes) {
                    document.getElementById('timerMinutes').value = stage.timerMinutes;
                }
                Stage2ManagementPage.renderAwardList();
            }
        } catch (error) {
            console.error('Failed to load award criteria:', error);
        }
    }

    static renderAwardList() {
        const container = document.getElementById('awardCriteriaList');
        
        container.innerHTML = window.stage2Awards.map((award, index) => `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">${award.name}</h3>
                        <p class="text-sm text-gray-500">${award.questions.length} questions</p>
                    </div>
                    <button 
                        onclick="Stage2ManagementPage.editAward(${index})"
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Edit Criteria & Scoring
                    </button>
                </div>
                <div class="p-6">
                    <div class="space-y-3">
                        ${award.questions.map((q, qi) => `
                            <div class="border-l-4 border-blue-500 pl-3">
                                <div class="text-sm font-medium text-gray-900">${qi + 1}. ${q}</div>
                                <div class="text-xs text-gray-500 mt-1">Scale: 1-5 ${award.scoringDescriptions && award.scoringDescriptions[qi] ? '✓ Configured' : '⚠️ Not configured'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    static editAward(index) {
        window.currentEditingAward = index;
        const award = window.stage2Awards[index];
        
        // Initialize scoring descriptions if not present
        if (!award.scoringDescriptions) {
            award.scoringDescriptions = award.questions.map(() => ({
                score1: '',
                score2: '',
                score3: '',
                score4: '',
                score5: ''
            }));
        }
        
        document.getElementById('modalAwardTitle').textContent = `Edit ${award.name} Criteria`;
        
        const form = document.getElementById('editQuestionsForm');
        form.innerHTML = award.questions.map((q, qi) => `
            <div class="border border-gray-200 rounded-lg p-4 space-y-3 mb-4">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold text-gray-700 w-8">${qi + 1}.</span>
                    <input 
                        type="text" 
                        id="question_${qi}"
                        value="${q}"
                        placeholder="Enter question/criterion"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md font-medium"
                    >
                    <button 
                        onclick="Stage2ManagementPage.removeQuestion(${qi})"
                        class="text-red-600 hover:text-red-800"
                        title="Delete question"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="ml-8 space-y-2 bg-gray-50 p-3 rounded">
                    <h4 class="text-xs font-semibold text-gray-700 uppercase">Scoring Scale Descriptions (1-5)</h4>
                    ${[1, 2, 3, 4, 5].map(score => `
                        <div class="flex items-start space-x-2">
                            <span class="text-xs font-bold text-blue-600 w-6 flex-shrink-0 mt-2">${score}:</span>
                            <textarea 
                                id="question_${qi}_score${score}"
                                placeholder="${score === 1 ? 'Meets elite threshold (good advanced performance)' : score === 2 ? 'Exceeds elite expectations (strong advanced performance)' : score === 3 ? 'Superior elite achievement (excellent advanced performance)' : score === 4 ? 'Outstanding elite excellence (exceptional advanced performance)' : 'Globally competitive mastery (world-class performance)'}"
                                class="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                rows="2"
                            >${award.scoringDescriptions[qi]?.[`score${score}`] || ''}</textarea>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('') + `
            <button 
                onclick="Stage2ManagementPage.addQuestion()"
                class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-500 hover:text-blue-700 text-sm font-medium"
            >
                + Add New Question
            </button>
        `;
        
        document.getElementById('editAwardModal').classList.remove('hidden');
    }

    static addQuestion() {
        const award = window.stage2Awards[window.currentEditingAward];
        award.questions.push('New question');
        if (!award.scoringDescriptions) {
            award.scoringDescriptions = [];
        }
        award.scoringDescriptions.push({
            score1: '',
            score2: '',
            score3: '',
            score4: '',
            score5: ''
        });
        Stage2ManagementPage.editAward(window.currentEditingAward);
    }

    static removeQuestion(qi) {
        const award = window.stage2Awards[window.currentEditingAward];
        if (award.questions.length > 1) {
            award.questions.splice(qi, 1);
            if (award.scoringDescriptions) {
                award.scoringDescriptions.splice(qi, 1);
            }
            Stage2ManagementPage.editAward(window.currentEditingAward);
        }
    }

    static async saveAwardCriteria() {
        const award = window.stage2Awards[window.currentEditingAward];
        
        // Collect updated questions and scoring descriptions
        award.questions = award.questions.map((_, qi) => {
            const input = document.getElementById(`question_${qi}`);
            return input ? input.value : _;
        });
        
        // Collect scoring descriptions
        award.scoringDescriptions = award.questions.map((_, qi) => ({
            score1: document.getElementById(`question_${qi}_score1`)?.value || '',
            score2: document.getElementById(`question_${qi}_score2`)?.value || '',
            score3: document.getElementById(`question_${qi}_score3`)?.value || '',
            score4: document.getElementById(`question_${qi}_score4`)?.value || '',
            score5: document.getElementById(`question_${qi}_score5`)?.value || ''
        }));
        
        try {
            const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 30;
            
            const response = await fetch('/api/stages/Stage%202', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.token}`
                },
                body: JSON.stringify({ 
                    criteria: window.stage2Awards,
                    timerMinutes: timerMinutes
                })
            });

            if (response.ok) {
                Stage2ManagementPage.closeEditModal();
                Stage2ManagementPage.loadAwardCriteria();
                alert('Criteria updated successfully!');
            }
        } catch (error) {
            alert('Failed to save criteria');
        }
    }

    static async saveTimer() {
        const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 30;
        
        try {
            const response = await fetch('/api/stages/Stage%202', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.token}`
                },
                body: JSON.stringify({
                    timerMinutes: timerMinutes
                })
            });

            if (response.ok) {
                alert('Timer saved successfully!');
            } else {
                alert('Failed to save timer');
            }
        } catch (error) {
            console.error('Error saving timer:', error);
            alert('Failed to save timer. Please try again.');
        }
    }

    static closeEditModal() {
        document.getElementById('editAwardModal').classList.add('hidden');
    }
}