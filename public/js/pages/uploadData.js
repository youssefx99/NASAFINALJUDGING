// Upload Data Page
class UploadDataPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Upload Team Data</h1>
                            <div class="flex items-center space-x-4">
                                <span class="text-gray-600">CSV Format: team_name, challenge, demo_link, proposal_link, subjects</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <!-- Upload Form -->
                        <div class="bg-white rounded-lg shadow mb-6">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-medium text-gray-900">Upload CSV File</h3>
                                <p class="text-sm text-gray-500 mt-1">Upload a CSV file containing team information</p>
                            </div>
                            <div class="p-6">
                                <form id="uploadForm" class="space-y-6">
                                    <div class="flex items-center justify-center w-full">
                                        <label for="csvFile" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div class="flex flex-col items-center justify-center pt-5 pb-6" id="dropZone">
                                                <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                </svg>
                                                <p class="mb-2 text-sm text-gray-500"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p class="text-xs text-gray-500">CSV files only</p>
                                            </div>
                                            <input id="csvFile" type="file" class="hidden" accept=".csv" />
                                        </label>
                                    </div>
                                    
                                    <div id="fileInfo" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span id="fileName" class="text-blue-800 font-medium"></span>
                                        </div>
                                    </div>
                                    
                                    <div id="uploadError" class="hidden bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span id="errorMessage" class="text-red-800"></span>
                                        </div>
                                    </div>
                                    
                                    <div id="uploadSuccess" class="hidden bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span id="successMessage" class="text-green-800"></span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        id="uploadBtn"
                                        class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled
                                    >
                                        Upload Teams Data
                                    </button>
                                </form>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        const fileInput = document.getElementById('csvFile');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadForm = document.getElementById('uploadForm');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const uploadError = document.getElementById('uploadError');
        const uploadSuccess = document.getElementById('uploadSuccess');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');

        // File input change handler
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    fileName.textContent = file.name;
                    fileInfo.classList.remove('hidden');
                    uploadBtn.disabled = false;
                    uploadError.classList.add('hidden');
                } else {
                    errorMessage.textContent = 'Please select a CSV file';
                    uploadError.classList.remove('hidden');
                    fileInfo.classList.add('hidden');
                    uploadBtn.disabled = true;
                }
            }
        });

        // Form submit handler
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('csvFile', file);

            // Show loading state
            uploadBtn.textContent = 'Uploading...';
            uploadBtn.disabled = true;
            uploadError.classList.add('hidden');
            uploadSuccess.classList.add('hidden');

            try {
                const response = await fetch('/api/teams/upload-csv', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authService.token}`
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    successMessage.textContent = `Successfully uploaded ${result.count} teams`;
                    uploadSuccess.classList.remove('hidden');
                    
                    // Reset form
                    uploadForm.reset();
                    fileInfo.classList.add('hidden');
                    uploadBtn.disabled = true;
                } else {
                    errorMessage.textContent = result.message || 'Upload failed';
                    uploadError.classList.remove('hidden');
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Please try again.';
                uploadError.classList.remove('hidden');
            } finally {
                uploadBtn.textContent = 'Upload Teams Data';
                uploadBtn.disabled = false;
            }
        });

        // Drag and drop handlers
        const dropZone = document.getElementById('dropZone').parentElement;
        
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.classList.add('border-blue-400', 'bg-blue-50');
        });

        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            dropZone.classList.remove('border-blue-400', 'bg-blue-50');
        });

        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.classList.remove('border-blue-400', 'bg-blue-50');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }
}
