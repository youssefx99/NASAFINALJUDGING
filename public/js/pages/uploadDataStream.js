// Import Teams Page: parses Excel/CSV in the browser and upserts teams in batches
class UploadDataStreamPage {
    static BATCH_SIZE = 250;
    static COLUMNS = [
        { key: 'team_name', required: true, hint: 'Unique team name' },
        { key: 'challenge', required: true, hint: 'Challenge title' },
        { key: 'demo_link' },
        { key: 'proposal_link' },
        { key: 'project_link' },
        { key: 'nasa_submit_link' },
        { key: 'subjects', hint: 'Comma separated' },
        { key: 'panel_number' },
        { key: 'actualSolution', hint: 'web, mobile or ai' },
    ];

    static rows = [];
    static rowNumbers = [];
    static cancelled = false;

    static render() {
        return Layout.admin({
            title: 'Import Teams',
            subtitle: 'Upload an Excel (.xlsx, .xls) or CSV file — existing teams with the same name are updated',
            actions: `
                <button onclick="UploadDataStreamPage.downloadTemplate()" class="btn btn-secondary">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download template
                </button>`,
            content: `
                <div class="grid gap-6 xl:grid-cols-3">
                    <div class="space-y-6 xl:col-span-2">
                        <div class="card">
                            <div class="card-body">
                                <label id="dropZone" for="teamsFile" class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    </div>
                                    <p class="text-sm text-slate-700"><span class="font-semibold text-blue-600">Click to choose a file</span> or drag and drop it here</p>
                                    <p class="mt-1 text-xs text-slate-500">.xlsx, .xls or .csv — the first sheet is used, row 1 must be the header</p>
                                    <input id="teamsFile" type="file" class="hidden" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" />
                                </label>
                            </div>
                        </div>

                        <div id="previewSection" class="hidden card">
                            <div class="card-header">
                                <div class="min-w-0">
                                    <h3 id="fileName" class="card-title truncate"></h3>
                                    <p id="fileSummary" class="mt-0.5 text-sm text-slate-500"></p>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="UploadDataStreamPage.reset()" class="btn btn-secondary">Choose another file</button>
                                    <button id="importBtn" onclick="UploadDataStreamPage.startImport()" class="btn btn-primary">Import teams</button>
                                </div>
                            </div>
                            <div class="card-body space-y-4">
                                <div id="columnCheck" class="flex flex-wrap gap-2"></div>
                                <div id="previewWarning" class="hidden rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"></div>
                                <div class="overflow-x-auto rounded-lg border border-slate-200">
                                    <table class="table">
                                        <thead id="previewHead"></thead>
                                        <tbody id="previewBody"></tbody>
                                    </table>
                                </div>
                                <p class="text-xs text-slate-500">Showing the first 5 rows.</p>
                            </div>
                        </div>

                        <div id="progressSection" class="hidden card">
                            <div class="card-header">
                                <h3 id="progressTitle" class="card-title">Importing…</h3>
                                <button id="cancelBtn" onclick="UploadDataStreamPage.cancelImport()" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Cancel</button>
                            </div>
                            <div class="card-body space-y-5">
                                <div>
                                    <div class="mb-2 flex justify-between text-sm">
                                        <span class="font-medium text-slate-700">Progress</span>
                                        <span id="progressText" class="font-mono text-slate-600">0 / 0</span>
                                    </div>
                                    <div class="progress h-3"><div id="progressBar" class="progress-bar" style="width: 0%"></div></div>
                                </div>
                                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div class="rounded-lg border border-slate-200 p-3"><p id="createdCount" class="text-2xl font-semibold text-emerald-600">0</p><p class="text-xs uppercase tracking-wide text-slate-500">Created</p></div>
                                    <div class="rounded-lg border border-slate-200 p-3"><p id="updatedCount" class="text-2xl font-semibold text-blue-600">0</p><p class="text-xs uppercase tracking-wide text-slate-500">Updated</p></div>
                                    <div class="rounded-lg border border-slate-200 p-3"><p id="failedCount" class="text-2xl font-semibold text-red-600">0</p><p class="text-xs uppercase tracking-wide text-slate-500">Failed</p></div>
                                    <div class="rounded-lg border border-slate-200 p-3"><p id="elapsedTime" class="text-2xl font-semibold text-slate-700">0.0s</p><p class="text-xs uppercase tracking-wide text-slate-500">Elapsed</p></div>
                                </div>
                                <div id="resultMessage" class="hidden rounded-lg border px-4 py-3 text-sm"></div>
                                <div id="errorBox" class="hidden">
                                    <p class="mb-2 text-sm font-medium text-slate-700">Rows that were not imported</p>
                                    <div id="errorList" class="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-800"></div>
                                </div>
                                <div id="doneActions" class="hidden flex flex-wrap gap-2">
                                    <button onclick="router.navigate('/admin/teams')" class="btn btn-primary">View teams</button>
                                    <button onclick="UploadDataStreamPage.reset()" class="btn btn-secondary">Import another file</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card h-fit">
                        <div class="card-header"><h3 class="card-title">Expected columns</h3></div>
                        <div class="card-body">
                            <p class="mb-3 text-sm text-slate-500">Header names are not case sensitive and spaces work too (e.g. <span class="font-medium text-slate-700">Team Name</span>).</p>
                            <ul class="space-y-2 text-sm">
                                ${UploadDataStreamPage.COLUMNS.map((column) => `
                                    <li class="flex items-start justify-between gap-3">
                                        <span class="font-mono text-slate-800">${column.key}</span>
                                        <span class="text-right text-xs ${column.required ? 'font-semibold text-red-600' : 'text-slate-500'}">${column.required ? 'Required' : column.hint || 'Optional'}</span>
                                    </li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `,
        });
    }

    static afterRender() {
        const fileInput = document.getElementById('teamsFile');
        const dropZone = document.getElementById('dropZone');

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) UploadDataStreamPage.readFile(fileInput.files[0]);
        });
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-400', 'bg-blue-50');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-400', 'bg-blue-50'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-400', 'bg-blue-50');
            if (e.dataTransfer.files[0]) UploadDataStreamPage.readFile(e.dataTransfer.files[0]);
        });
    }

    static normalizeHeader(header) {
        return String(header).trim().toLowerCase().replace(/[\s-]+/g, '_');
    }

    static async readFile(file) {
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
            UI.toast('Please choose an .xlsx, .xls or .csv file', 'error');
            return;
        }
        const dropZone = document.getElementById('dropZone');
        dropZone.classList.add('pointer-events-none', 'opacity-60');
        try {
            await UI.loadSheetJs();
            const workbook = /\.csv$/i.test(file.name)
                ? XLSX.read(await file.text(), { type: 'string' })
                : XLSX.read(await file.arrayBuffer(), { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            if (rows.length === 0) throw new Error('The file has no data rows under the header');

            UploadDataStreamPage.rows = rows;
            UploadDataStreamPage.rowNumbers = rows.map((row, index) => (row.__rowNum__ ?? index + 1) + 1);
            UploadDataStreamPage.renderPreview(file, rows);
        } catch (error) {
            UI.toast(error.message || 'Could not read the file', 'error');
            UploadDataStreamPage.reset();
        } finally {
            dropZone.classList.remove('pointer-events-none', 'opacity-60');
        }
    }

    static renderPreview(file, rows) {
        const headers = Object.keys(rows[0]).filter((h) => !h.startsWith('__EMPTY'));
        const normalized = headers.map(UploadDataStreamPage.normalizeHeader);
        const missingRequired = UploadDataStreamPage.COLUMNS
            .filter((column) => column.required && !normalized.includes(column.key))
            .map((column) => column.key);

        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSummary').textContent =
            `${rows.length.toLocaleString()} rows · ${headers.length} columns · ${(file.size / 1024).toFixed(1)} KB`;
        document.getElementById('columnCheck').innerHTML = UploadDataStreamPage.COLUMNS.map((column) => {
            const found = normalized.includes(UploadDataStreamPage.normalizeHeader(column.key));
            return `<span class="badge ${found ? 'badge-green' : column.required ? 'badge-red' : 'badge-gray'}">${found ? '✓' : column.required ? '✕' : '–'} ${column.key}</span>`;
        }).join('');

        const warning = document.getElementById('previewWarning');
        warning.classList.toggle('hidden', missingRequired.length === 0);
        warning.textContent = missingRequired.length
            ? `Missing required column(s): ${missingRequired.join(', ')}. Add them to the header row and choose the file again.`
            : '';
        document.getElementById('importBtn').disabled = missingRequired.length > 0;
        document.getElementById('importBtn').textContent = `Import ${rows.length.toLocaleString()} teams`;

        document.getElementById('previewHead').innerHTML =
            `<tr><th>Row</th>${headers.map((h) => `<th>${UI.escape(h)}</th>`).join('')}</tr>`;
        document.getElementById('previewBody').innerHTML = rows.slice(0, 5).map((row, index) => `
            <tr><td class="text-slate-400">${UploadDataStreamPage.rowNumbers[index]}</td>${headers.map((h) => `<td class="max-w-[16rem] truncate">${UI.escape(row[h])}</td>`).join('')}</tr>
        `).join('');

        document.getElementById('previewSection').classList.remove('hidden');
        document.getElementById('progressSection').classList.add('hidden');
    }

    static async startImport() {
        const { rows, rowNumbers, BATCH_SIZE } = UploadDataStreamPage;
        if (rows.length === 0) return;

        UploadDataStreamPage.cancelled = false;
        document.getElementById('previewSection').classList.add('hidden');
        document.getElementById('progressSection').classList.remove('hidden');
        ['resultMessage', 'errorBox', 'doneActions'].forEach((id) => document.getElementById(id).classList.add('hidden'));
        document.getElementById('cancelBtn').classList.remove('hidden');
        document.getElementById('progressTitle').textContent = 'Importing…';

        const totals = { created: 0, updated: 0, duplicates: 0, failed: 0, errors: [] };
        const startTime = performance.now();
        const update = (processed) => {
            const percent = Math.round((processed / rows.length) * 100);
            document.getElementById('progressBar').style.width = `${percent}%`;
            document.getElementById('progressText').textContent = `${processed.toLocaleString()} / ${rows.length.toLocaleString()} (${percent}%)`;
            document.getElementById('createdCount').textContent = totals.created.toLocaleString();
            document.getElementById('updatedCount').textContent = totals.updated.toLocaleString();
            document.getElementById('failedCount').textContent = totals.failed.toLocaleString();
            document.getElementById('elapsedTime').textContent = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
        };
        update(0);

        let processed = 0;
        let fatalError = null;
        for (let start = 0; start < rows.length && !UploadDataStreamPage.cancelled; start += BATCH_SIZE) {
            try {
                const result = await UI.api('/api/teams/import', {
                    method: 'POST',
                    body: { rows: rows.slice(start, start + BATCH_SIZE), rowNumbers: rowNumbers.slice(start, start + BATCH_SIZE) },
                });
                totals.created += result.created;
                totals.updated += result.updated;
                totals.duplicates += result.duplicates;
                totals.failed += result.failed;
                totals.errors.push(...result.errors);
            } catch (error) {
                fatalError = error;
                break;
            }
            processed = Math.min(start + BATCH_SIZE, rows.length);
            update(processed);
        }

        const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
        const message = document.getElementById('resultMessage');
        let tone;
        if (fatalError) {
            tone = 'border-red-200 bg-red-50 text-red-800';
            message.textContent = `Import stopped after ${processed.toLocaleString()} rows: ${fatalError.message}`;
        } else if (UploadDataStreamPage.cancelled) {
            tone = 'border-amber-200 bg-amber-50 text-amber-800';
            message.textContent = `Import cancelled after ${processed.toLocaleString()} of ${rows.length.toLocaleString()} rows.`;
        } else {
            tone = totals.failed ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
            message.textContent =
                `Imported ${(totals.created + totals.updated).toLocaleString()} teams in ${seconds}s — ${totals.created} created, ${totals.updated} updated` +
                (totals.duplicates ? `, ${totals.duplicates} duplicate rows merged` : '') +
                (totals.failed ? `, ${totals.failed} rows skipped.` : '.');
        }
        message.className = `rounded-lg border px-4 py-3 text-sm ${tone}`;

        if (totals.errors.length) {
            document.getElementById('errorList').innerHTML = totals.errors.map((e) => `<div>${UI.escape(e)}</div>`).join('');
            document.getElementById('errorBox').classList.remove('hidden');
        }
        document.getElementById('progressTitle').textContent = fatalError ? 'Import failed' : UploadDataStreamPage.cancelled ? 'Import cancelled' : 'Import complete';
        document.getElementById('cancelBtn').classList.add('hidden');
        document.getElementById('doneActions').classList.remove('hidden');
        UI.toast(message.textContent, fatalError ? 'error' : totals.failed || UploadDataStreamPage.cancelled ? 'warning' : 'success', 6000);
    }

    static cancelImport() {
        UploadDataStreamPage.cancelled = true;
    }

    static reset() {
        UploadDataStreamPage.rows = [];
        UploadDataStreamPage.rowNumbers = [];
        const input = document.getElementById('teamsFile');
        if (input) input.value = '';
        document.getElementById('previewSection')?.classList.add('hidden');
        document.getElementById('progressSection')?.classList.add('hidden');
    }

    static downloadTemplate() {
        const header = UploadDataStreamPage.COLUMNS.map((column) => column.key).join(',');
        const example = 'Orbit Builders,Exoplanet Explorer,https://example.com/demo,https://example.com/proposal,https://github.com/example/project,https://www.spaceappschallenge.org/projects/orbit,"Space Technology, Data",1,web';
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([`${header}\n${example}\n`], { type: 'text/csv' }));
        link.download = 'teams-template.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }
}
