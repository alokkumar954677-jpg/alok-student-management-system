import { useEffect, useState } from 'react';
import { Copy, Check, Download, Terminal, GitBranch, Globe } from 'lucide-react';
import type { DeliverableFile } from '../types/student';

export function PythonDeliverablesView() {
  const [files, setFiles] = useState<DeliverableFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/deliverables')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      })
      .catch((err) => {
        console.error('Failed to load Python deliverables:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currentFile =
    files.find((f) => f.name === activeFile) ?? files[0] ?? null;

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleDownloadFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Quick Reference Cards: VS Code, GitHub, Streamlit Cloud */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#062C24]">
            <Terminal className="h-4 w-4 text-[#0D6B58]" />
            <span>1. Run in VS Code</span>
          </div>
          <pre className="mt-3 rounded-lg bg-[#062C24] text-emerald-50 p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`cd python_streamlit
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py`}
          </pre>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#062C24]">
            <GitBranch className="h-4 w-4 text-[#0D6B58]" />
            <span>2. Push to GitHub</span>
          </div>
          <pre className="mt-3 rounded-lg bg-[#062C24] text-emerald-50 p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "Student Management System"
git branch -M main
git remote add origin <repo-url>
git push -u origin main`}
          </pre>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#062C24]">
            <Globe className="h-4 w-4 text-[#0D6B58]" />
            <span>3. Deploy Online</span>
          </div>
          <ol className="mt-3 space-y-1.5 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
            <li>Open <span className="font-mono text-slate-800">share.streamlit.io</span> and sign in with GitHub.</li>
            <li>Click <span className="font-semibold text-slate-800">New app</span> and select your repository.</li>
            <li>Set Main file path to <span className="font-mono text-slate-800">app.py</span> and click Deploy.</li>
          </ol>
        </div>
      </section>

      {/* Source Code Inspector */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 overflow-x-auto">
            {files.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setActiveFile(file.name)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                  currentFile?.name === file.name
                    ? 'bg-white text-[#062C24] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          {currentFile && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy File
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D6B58] text-xs font-semibold text-white hover:bg-[#0A5344] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6">
            <div className="h-64 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : currentFile ? (
          <div className="bg-[#062C24] text-emerald-50 p-5 overflow-x-auto max-h-[560px]">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre">
              {currentFile.content}
            </pre>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No deliverable files found.
          </div>
        )}
      </section>
    </div>
  );
}
