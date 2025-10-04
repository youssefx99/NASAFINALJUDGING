// Judges Management Page
class JudgesManagementPage {
  static render() {
    return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Judges Management</h1>
                            <div class="flex space-x-3">
                                <button 
                                    onclick="JudgesManagementPage.showCsvUploadModal()"
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Upload CSV
                                </button>
                                <button 
                                    onclick="JudgesManagementPage.showCreateModal()"
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Add New Judge
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <!-- Judges Table -->
                        <div class="bg-white rounded-lg shadow overflow-hidden">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-medium text-gray-900">All Judges</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Assignments</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="judgesTableBody" class="bg-white divide-y divide-gray-200">
                                        <!-- Judges will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create/Edit Judge Modal -->
            <div id="judgeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-md w-full">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 id="modalTitle" class="text-lg font-medium text-gray-900">Add New Judge</h3>
                        </div>
                        <form id="judgeForm" class="p-6 space-y-4">
                            <input type="hidden" id="judgeId" />
                            
                            <div>
                                <label for="judgeName" class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input 
                                    type="text" 
                                    id="judgeName" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label for="judgeEmail" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input 
                                    type="email" 
                                    id="judgeEmail" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div id="passwordField">
                                <label for="judgePassword" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input 
                                    type="password" 
                                    id="judgePassword" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label for="panelStage1" class="block text-sm font-medium text-gray-700 mb-2">Panel for Stage 1</label>
                                <select 
                                    id="panelStage1" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Panel</option>
                                </select>
                            </div>
                            
                            <div>
                                <label for="panelStage2" class="block text-sm font-medium text-gray-700 mb-2">Panel for Stage 2</label>
                                <select 
                                    id="panelStage2" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Panel</option>
                                </select>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onclick="JudgesManagementPage.hideModal()"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Save Judge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- CSV Upload Modal -->
            <div id="csvUploadModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-2xl w-full">
                        <div class="px-6 py-4 border-b border-gray-200 bg-green-50">
                            <h3 class="text-lg font-medium text-gray-900">Upload Judges CSV</h3>
                            <p class="text-sm text-gray-600 mt-1">Upload a CSV file with judge information</p>
                        </div>
                        
                        <div class="p-6">
                            <!-- CSV Format Info -->
                            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h4 class="text-sm font-medium text-blue-900 mb-2">Required CSV Format:</h4>
                                <div class="text-xs text-blue-800 space-y-1">
                                    <p><strong>Columns:</strong> Title, Name, Last time judged in NSAC, Email, LinkedIn, Phone, Judging Area, Reached Out by Call, Response Status, Confirmed, Filled the Form</p>
                                    <p><strong>Data Generation:</strong></p>
                                    <ul class="ml-4 space-y-1">
                                        <li>• <strong>Name:</strong> Uses CSV Name column</li>
                                        <li>• <strong>Email:</strong> Generated from name (lowercase with underscores)</li>
                                        <li>• <strong>Password:</strong> Counter + first name (e.g., "1John", "2Sarah")</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- File Upload Form -->
                            <form id="csvUploadForm" class="space-y-4">
                                <div>
                                    <label for="csvFile" class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                        <input 
                                            type="file" 
                                            id="csvFile" 
                                            accept=".csv" 
                                            class="hidden"
                                            required
                                        />
                                        <div id="fileInfo" class="hidden">
                                            <p class="text-sm text-gray-600" id="fileName"></p>
                                            <p class="text-xs text-gray-500" id="fileSize"></p>
                                        </div>
                                        <div id="dropZone">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                            <p class="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                            <p class="text-xs text-gray-500">CSV files only</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Upload Status -->
                                <div id="uploadStatus" class="hidden">
                                    <div id="uploadSuccess" class="hidden p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p class="text-sm text-green-800" id="successMessage"></p>
                                    </div>
                                    <div id="uploadError" class="hidden p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p class="text-sm text-red-800" id="errorMessage"></p>
                                    </div>
                                </div>

                                <div class="flex justify-end space-x-3 pt-4">
                                    <button 
                                        type="button" 
                                        onclick="JudgesManagementPage.hideCsvUploadModal()"
                                        class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        id="uploadBtn"
                                        disabled
                                        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        Upload Judges
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static afterRender() {
    JudgesManagementPage.loadJudges();
    JudgesManagementPage.loadPanels();
    JudgesManagementPage.setupEventListeners();
  }

  static async loadJudges() {
    try {
      const response = await fetch('/api/users/judges', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const judges = await response.json();
        JudgesManagementPage.renderJudgesTable(judges);
      }
    } catch (error) {
      console.error('Failed to load judges:', error);
    }
  }

  static async loadPanels() {
    try {
      const response = await fetch('/api/panels', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const panels = await response.json();
        JudgesManagementPage.populatePanelSelects(panels);
      }
    } catch (error) {
      console.error('Failed to load panels:', error);
    }
  }

  static renderJudgesTable(judges) {
    const tbody = document.getElementById('judgesTableBody');
    tbody.innerHTML = judges
      .map(
        (judge) => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${judge.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${judge.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${judge.panelAssignments?.length || 0} panels assigned
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                        onclick="router.navigate('/admin/judges/${judge._id}')"
                        class="text-green-600 hover:text-green-900 mr-3"
                    >
                        View
                    </button>
                    <button 
                        onclick="JudgesManagementPage.editJudge('${judge._id}')"
                        class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                        Edit
                    </button>
                    <button 
                        onclick="JudgesManagementPage.deleteJudge('${judge._id}')"
                        class="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `,
      )
      .join('');
  }

  static populatePanelSelects(panels) {
    const stage1Select = document.getElementById('panelStage1');
    const stage2Select = document.getElementById('panelStage2');

    const stage1Panels = panels.filter((p) => p.stage === 1 || p.stage === '1');
    const stage2Panels = panels.filter((p) => p.stage === 2 || p.stage === '2');

    stage1Select.innerHTML =
      '<option value="">Select Panel</option>' +
      stage1Panels
        .map((p) => `<option value="${p._id}">${p.name}</option>`)
        .join('');

    stage2Select.innerHTML =
      '<option value="">Select Panel</option>' +
      stage2Panels
        .map((p) => `<option value="${p._id}">${p.name}</option>`)
        .join('');
  }

  static setupEventListeners() {
    const form = document.getElementById('judgeForm');
    form.addEventListener('submit', JudgesManagementPage.handleSubmit);

    // CSV upload form
    const csvForm = document.getElementById('csvUploadForm');
    csvForm.addEventListener('submit', JudgesManagementPage.handleCsvUpload);

    // File input change handler
    const fileInput = document.getElementById('csvFile');
    fileInput.addEventListener('change', JudgesManagementPage.handleFileSelect);

    // Drag and drop handlers
    const dropZone = document.querySelector('#csvUploadModal .border-dashed');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', JudgesManagementPage.handleDragOver);
    dropZone.addEventListener('drop', JudgesManagementPage.handleDrop);
  }

  static async showCreateModal() {
    try {
      // Load panels for the dropdowns
      const response = await fetch('/api/panels', {
        headers: { Authorization: `Bearer ${authService.token}` },
      });

      if (response.ok) {
        const panels = await response.json();
        JudgesManagementPage.populatePanelSelects(panels);
      }

      document.getElementById('modalTitle').textContent = 'Add New Judge';
      document.getElementById('judgeForm').reset();
      document.getElementById('judgeId').value = '';
      document.getElementById('passwordField').style.display = 'block';
      document.getElementById('judgeModal').classList.remove('hidden');
    } catch (error) {
      console.error('Failed to load panels:', error);
      // Still show modal even if panels fail to load
      document.getElementById('modalTitle').textContent = 'Add New Judge';
      document.getElementById('judgeForm').reset();
      document.getElementById('judgeId').value = '';
      document.getElementById('passwordField').style.display = 'block';
      document.getElementById('judgeModal').classList.remove('hidden');
    }
  }

  static hideModal() {
    document.getElementById('judgeModal').classList.add('hidden');
  }

  static async editJudge(judgeId) {
    try {
      // Load judge data and panels in parallel
      const [judgeResponse, panelsResponse] = await Promise.all([
        fetch(`/api/users/${judgeId}`, {
          headers: { Authorization: `Bearer ${authService.token}` },
        }),
        fetch('/api/panels', {
          headers: { Authorization: `Bearer ${authService.token}` },
        }),
      ]);

      if (judgeResponse.ok && panelsResponse.ok) {
        const judge = await judgeResponse.json();
        const panels = await panelsResponse.json();

        // Populate panel dropdowns first
        JudgesManagementPage.populatePanelSelects(panels);

        // Then set judge data
        document.getElementById('modalTitle').textContent = 'Edit Judge';
        document.getElementById('judgeId').value = judge._id;
        document.getElementById('judgeName').value = judge.name;
        document.getElementById('judgeEmail').value = judge.email;
        document.getElementById('passwordField').style.display = 'none';

        // Set panel assignments after dropdowns are populated
        const stage1Assignment = judge.panelAssignments?.find(
          (pa) => pa.stage === 1 || pa.stage === '1',
        );
        const stage2Assignment = judge.panelAssignments?.find(
          (pa) => pa.stage === 2 || pa.stage === '2',
        );

        if (stage1Assignment) {
          const panelId =
            typeof stage1Assignment.panel === 'string'
              ? stage1Assignment.panel
              : stage1Assignment.panel?._id;
          document.getElementById('panelStage1').value = panelId || '';
        }
        if (stage2Assignment) {
          const panelId =
            typeof stage2Assignment.panel === 'string'
              ? stage2Assignment.panel
              : stage2Assignment.panel?._id;
          document.getElementById('panelStage2').value = panelId || '';
        }

        document.getElementById('judgeModal').classList.remove('hidden');
      }
    } catch (error) {
      console.error('Failed to load judge:', error);
      alert('Failed to load judge data. Please try again.');
    }
  }

  static async deleteJudge(judgeId) {
    if (confirm('Are you sure you want to delete this judge?')) {
      try {
        const response = await fetch(`/api/users/${judgeId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authService.token}`,
          },
        });

        if (response.ok) {
          JudgesManagementPage.loadJudges();
        }
      } catch (error) {
        console.error('Failed to delete judge:', error);
      }
    }
  }

  static async handleSubmit(e) {
    e.preventDefault();

    const judgeId = document.getElementById('judgeId').value;
    const formData = {
      name: document.getElementById('judgeName').value,
      email: document.getElementById('judgeEmail').value,
      role: 'judge',
      panelAssignments: [],
    };

    if (!judgeId) {
      formData.password = document.getElementById('judgePassword').value;
    }

    // Add panel assignments
    const stage1Panel = document.getElementById('panelStage1').value;
    const stage2Panel = document.getElementById('panelStage2').value;

    if (stage1Panel) {
      formData.panelAssignments.push({ stage: 1, panel: stage1Panel });
    }
    if (stage2Panel) {
      formData.panelAssignments.push({ stage: 2, panel: stage2Panel });
    }

    try {
      const url = judgeId ? `/api/users/${judgeId}` : '/api/users';
      const method = judgeId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        JudgesManagementPage.hideModal();
        JudgesManagementPage.loadJudges();
      }
    } catch (error) {
      console.error('Failed to save judge:', error);
    }
  }

  // CSV Upload Methods
  static showCsvUploadModal() {
    document.getElementById('csvUploadModal').classList.remove('hidden');
    // Reset form
    document.getElementById('csvUploadForm').reset();
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('uploadStatus').classList.add('hidden');
  }

  static hideCsvUploadModal() {
    document.getElementById('csvUploadModal').classList.add('hidden');
  }

  static handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      JudgesManagementPage.displayFileInfo(file);
    }
  }

  static displayFileInfo(file) {
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileInfo = document.getElementById('fileInfo');
    const dropZone = document.getElementById('dropZone');
    const uploadBtn = document.getElementById('uploadBtn');

    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    fileInfo.classList.remove('hidden');
    dropZone.classList.add('hidden');
    uploadBtn.disabled = false;
  }

  static handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  }

  static handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        document.getElementById('csvFile').files = files;
        JudgesManagementPage.displayFileInfo(file);
      } else {
        alert('Please select a CSV file.');
      }
    }
  }

  static async handleCsvUpload(e) {
    e.preventDefault();

    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    // Show loading state
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadError = document.getElementById('uploadError');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const uploadStatus = document.getElementById('uploadStatus');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    uploadStatus.classList.remove('hidden');
    uploadError.classList.add('hidden');
    uploadSuccess.classList.add('hidden');

    try {
      const response = await fetch('/api/judges/upload-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        successMessage.textContent = `Successfully uploaded ${result.count} judges`;
        uploadSuccess.classList.remove('hidden');

        // Reset form
        document.getElementById('csvUploadForm').reset();
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('dropZone').classList.remove('hidden');
        uploadBtn.disabled = true;

        // Reload judges table
        JudgesManagementPage.loadJudges();
      } else {
        errorMessage.textContent = result.message || 'Upload failed';
        uploadError.classList.remove('hidden');
      }
    } catch (error) {
      errorMessage.textContent = 'Network error. Please try again.';
      uploadError.classList.remove('hidden');
    } finally {
      uploadBtn.textContent = 'Upload Judges';
      uploadBtn.disabled = false;
    }
  }
}
