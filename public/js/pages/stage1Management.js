// Stage 1 Management Page
class Stage1ManagementPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Stage 1 Management</h1>
                            <button 
                                onclick="Stage1ManagementPage.saveCriteria()"
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Save Criteria
                            </button>
                        </div>
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
                                        onclick="Stage1ManagementPage.saveTimer()"
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Save Timer
                                    </button>
                                </div>
                                <p class="mt-2 text-xs text-gray-500">This timer will be displayed to judges when scoring teams in Stage 1.</p>
                            </div>
                        </div>

                        <!-- Criteria Configuration -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <div class="flex justify-between items-center">
                                    <h2 class="text-lg font-medium text-gray-900">Configure Scoring Criteria</h2>
                                    <button 
                                        onclick="Stage1ManagementPage.addCriterion()"
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Add Criterion
                                    </button>
                                </div>
                            </div>
                            <div class="p-6">
                                <div id="criteriaForm" class="space-y-6">
                                    <!-- Criteria form will be rendered here -->
                                </div>
                                
                           
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        Stage1ManagementPage.loadCurrentCriteria();
    }

    static async loadCurrentCriteria() {
        try {
            const response = await fetch('/api/stages/Stage%201', {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const stage = await response.json();
                // Load existing criteria from database
                if (stage.criteria && stage.criteria.length > 0) {
                    window.stage1Criteria = stage.criteria;
                }
                // Load timer setting
                if (stage.timerMinutes) {
                    document.getElementById('timerMinutes').value = stage.timerMinutes;
                }
                Stage1ManagementPage.renderCriteriaForm();
            } else {
                Stage1ManagementPage.renderCriteriaForm();
            }
        } catch (error) {
            console.error('Failed to load current criteria:', error);
            Stage1ManagementPage.renderCriteriaForm();
        }
    }

    static renderCriteriaForm() {
        const container = document.getElementById('criteriaForm');
        
        if (!window.stage1Criteria) {
            window.stage1Criteria = [
                { 
                    name: 'Impact', 
                    questions: ['Does the solution address a significant problem?', 'Will it have meaningful impact?', 'Is the scope appropriate?'], 
                    weight: 0.3 
                },
                { 
                    name: 'Creativity', 
                    questions: ['Is the approach innovative?', 'Does it show original thinking?'], 
                    weight: 0.2 
                },
                { 
                    name: 'Technical Implementation', 
                    questions: ['Is the technical approach sound?', 'Is the implementation feasible?', 'Are the tools appropriate?'], 
                    weight: 0.3 
                },
                { 
                    name: 'Presentation', 
                    questions: ['Is the presentation clear?', 'Are the materials well-organized?'], 
                    weight: 0.2 
                }
            ];
        }

        container.innerHTML = window.stage1Criteria.map((criterion, index) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Criterion ${index + 1}</h3>
                    <button 
                        onclick="Stage1ManagementPage.removeCriterion(${index})"
                        class="text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Criterion Name</label>
                        <input 
                            type="text" 
                            value="${criterion.name}"
                            onchange="Stage1ManagementPage.updateCriterion(${index}, 'name', this.value)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Impact, Creativity"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Weight (0.0 - 1.0)</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            max="1"
                            value="${criterion.weight}"
                            onchange="Stage1ManagementPage.updateCriterion(${index}, 'weight', parseFloat(this.value))"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                        <p class="text-xs text-gray-500 mt-1">${(criterion.weight * 100).toFixed(1)}% importance</p>
                    </div>
                </div>
                
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-medium text-gray-700">Questions (Each = 1 point)</label>
                        <button 
                            onclick="Stage1ManagementPage.addQuestion(${index})"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            + Add Question
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${criterion.questions.map((question, qIndex) => `
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-gray-500 w-8">${qIndex + 1}.</span>
                                <input 
                                    type="text" 
                                    value="${question}"
                                    onchange="Stage1ManagementPage.updateQuestion(${index}, ${qIndex}, this.value)"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter question text..."
                                >
                                <button 
                                    onclick="Stage1ManagementPage.removeQuestion(${index}, ${qIndex})"
                                    class="text-red-600 hover:text-red-800"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Total Points: ${criterion.questions.length} | Weighted Score: ${(criterion.questions.length * criterion.weight).toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }

    static addCriterion() {
        if (!window.stage1Criteria) {
            window.stage1Criteria = [];
        }
        
        window.stage1Criteria.push({
            name: 'New Criterion',
            questions: ['New question'],
            weight: 0.1
        });
        
        Stage1ManagementPage.renderCriteriaForm();
    }

    static removeCriterion(index) {
        if (window.stage1Criteria && window.stage1Criteria.length > 1) {
            window.stage1Criteria.splice(index, 1);
            Stage1ManagementPage.renderCriteriaForm();
        }
    }

    static updateCriterion(index, field, value) {
        if (window.stage1Criteria && window.stage1Criteria[index]) {
            window.stage1Criteria[index][field] = value;
        }
    }

    static addQuestion(criterionIndex) {
        if (window.stage1Criteria && window.stage1Criteria[criterionIndex]) {
            window.stage1Criteria[criterionIndex].questions.push('New question');
            Stage1ManagementPage.renderCriteriaForm();
        }
    }

    static removeQuestion(criterionIndex, questionIndex) {
        if (window.stage1Criteria && window.stage1Criteria[criterionIndex] && 
            window.stage1Criteria[criterionIndex].questions.length > 1) {
            window.stage1Criteria[criterionIndex].questions.splice(questionIndex, 1);
            Stage1ManagementPage.renderCriteriaForm();
        }
    }

    static updateQuestion(criterionIndex, questionIndex, value) {
        if (window.stage1Criteria && window.stage1Criteria[criterionIndex] && 
            window.stage1Criteria[criterionIndex].questions[questionIndex] !== undefined) {
            window.stage1Criteria[criterionIndex].questions[questionIndex] = value;
        }
    }

    static async saveTimer() {
        const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 30;
        
        try {
            const response = await fetch('/api/stages/Stage%201', {
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

    static async saveCriteria() {
        if (!window.stage1Criteria || window.stage1Criteria.length === 0) {
            alert('Please add at least one criterion');
            return;
        }

        // Validate weights
        const totalWeight = window.stage1Criteria.reduce((sum, c) => sum + c.weight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            alert('Total weight must equal 1.0 (100%). Current total: ' + (totalWeight * 100).toFixed(1) + '%');
            return;
        }

        // Validate names
        const emptyNames = window.stage1Criteria.filter(c => !c.name.trim());
        if (emptyNames.length > 0) {
            alert('All criteria must have names');
            return;
        }

        try {
            const timerMinutes = parseInt(document.getElementById('timerMinutes').value) || 30;
            
            const response = await fetch('/api/stages/Stage%201', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.token}`
                },
                body: JSON.stringify({
                    criteria: window.stage1Criteria,
                    timerMinutes: timerMinutes
                })
            });

            if (response.ok) {
                alert('Stage 1 criteria saved successfully!');
                Stage1ManagementPage.loadCurrentCriteria();
            } else {
                const error = await response.text();
                alert('Failed to save criteria: ' + error);
            }
        } catch (error) {
            console.error('Error saving criteria:', error);
            alert('Failed to save criteria. Please try again.');
        }
    }
}
