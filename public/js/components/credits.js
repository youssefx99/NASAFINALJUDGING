// Platform credits (opened from the floating info button)
class Credits {
    static open() {
        if (document.getElementById('creditsModal')) return;
        const overlay = document.createElement('div');
        overlay.id = 'creditsModal';
        overlay.className = 'fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/50 p-4';
        overlay.innerHTML = `
            <div class="card w-full max-w-sm overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="creditsTitle">
                <div class="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-6 py-6 text-center text-white">
                    <img src="/assets/nasa%20cairo%20logo.png" alt="" class="mx-auto h-14 w-14 rounded-xl bg-white object-contain p-1">
                    <p class="mt-3 text-xs uppercase tracking-[0.3em] text-blue-200">NASA Space Apps Judging Platform</p>
                </div>
                <div class="px-6 py-5 text-center">
                    <p class="text-sm text-slate-500">Developed by</p>
                    <h3 id="creditsTitle" class="mt-1 text-xl font-semibold text-slate-900">Youssef Faisal</h3>
                    <div class="mt-5 grid gap-2">
                        <a href="https://www.linkedin.com/in/yousef-faisal/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary justify-start">
                            <svg class="h-5 w-5 text-[#0a66c2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
                            LinkedIn · yousef-faisal
                        </a>
                        <a href="https://www.instagram.com/_youssef_faisal/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary justify-start">
                            <svg class="h-5 w-5 text-[#e1306c]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.88 5.88 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>
                            Instagram · @_youssef_faisal
                        </a>
                    </div>
                    <button data-close class="btn btn-ghost mt-4 w-full">Close</button>
                </div>
            </div>
        `;
        const close = () => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('[data-close]')) close();
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
    }
}
