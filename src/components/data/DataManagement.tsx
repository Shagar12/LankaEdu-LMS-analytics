import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { exportToCSV, generateEmptyCSVTemplate } from '../../utils/grading';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const DataManagement: React.FC = () => {
  const {
    students,
    selectedGrade,
    selectedDivision,
    selectedTerm,
    currentSubjects,
    bulkImportStudents,
    resetToDemoData,
  } = useLMS();

  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
  } | null>(null);

  const [previewData, setPreviewData] = useState<any[] | null>(null);

  // 1. Export Current Class Mark Sheet to CSV
  const handleExportClassCSV = () => {
    const csvContent = exportToCSV(
      students,
      selectedGrade,
      selectedDivision,
      selectedTerm,
      currentSubjects
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MarkSheet_Grade${selectedGrade}_Div${selectedDivision}_Term${selectedTerm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Template CSV
  const handleDownloadTemplate = () => {
    const csvContent = generateEmptyCSVTemplate(selectedGrade, selectedDivision, currentSubjects);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Grade${selectedGrade}_Div${selectedDivision}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Handle File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVInput(text);
    };
    reader.readAsText(file);
  };

  const parseCSVInput = (csvText: string) => {
    try {
      const lines = csvText.trim().split(/\r\n|\n/);
      if (lines.length < 2) {
        setImportStatus({
          success: false,
          message: 'The uploaded CSV file is empty or missing content rows.',
        });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      const parsedRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split considering quoted strings
        const values: string[] = [];
        let insideQuote = false;
        let cur = '';

        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"' || char === "'") {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        values.push(cur.trim());

        // Extract known fields
        const fullName = values[2] || values[0] || `Student ${i}`;
        const indexNumber = values[1] || `IDX-${selectedGrade * 1000 + i}`;
        const studentId = values[0]?.startsWith('LK-') ? values[0] : `LK-${selectedGrade}${selectedDivision}-${1000 + i}`;

        const marks: Record<string, number> = {};
        currentSubjects.forEach((sub, subIdx) => {
          // Look for mark in subsequent columns
          const val = parseInt(values[6 + subIdx] || values[4 + subIdx] || '65', 10);
          marks[sub.id] = isNaN(val) ? 55 : Math.max(0, Math.min(100, val));
        });

        parsedRows.push({
          id: studentId,
          indexNumber,
          fullName,
          grade: selectedGrade,
          division: selectedDivision,
          terms: {
            [selectedTerm]: {
              marks,
            },
          },
        });
      }

      setPreviewData(parsedRows);
      setImportStatus(null);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Failed to parse CSV: ${err?.message || 'Invalid format'}`,
      });
    }
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    const result = bulkImportStudents(previewData);
    setImportStatus({
      success: true,
      message: `Successfully imported / updated ${result.successCount} student mark records!`,
      errors: result.errors,
    });
    setPreviewData(null);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all grades, student records, and marks back to standard demonstration datasets?')) {
      resetToDemoData();
      alert('LMS data reset to Sri Lankan national curriculum default benchmark.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Data Management & CSV Exchange
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Import and export mark sheets in standard CSV/Excel format, download templates, and maintain student rosters
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Grid: Export vs Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
              <Download className="w-5 h-5" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Export Mark Sheets (CSV / Excel)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Generate a comprehensive Excel-compatible CSV file for Grade {selectedGrade}-{selectedDivision} (Term {selectedTerm}), including subject marks, automated letter grades (A, B, C, S, W), total scores, averages, and class rank.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700/60 mb-5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold block mb-1">Active File Export Parameters:</span>
              <div>· Grade: <strong className="text-slate-900 dark:text-white">Grade {selectedGrade}</strong></div>
              <div>· Class Division: <strong className="text-slate-900 dark:text-white">Division {selectedDivision}</strong></div>
              <div>· Exam Term: <strong className="text-slate-900 dark:text-white">Term {selectedTerm}</strong></div>
              <div>· Curricular Subjects: <strong className="text-slate-900 dark:text-white">{currentSubjects.length} Subjects</strong></div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleExportClassCSV}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Class Mark Sheet CSV</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4">
              <Upload className="w-5 h-5" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Import Mark Sheets via CSV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Upload class mark sheets populated by subject teachers. The system validates mark ranges (0–100) and automatically recalculates Sri Lankan letter grades and rankings.
            </p>

            <div className="mb-4">
              <label
                htmlFor="csv-file-input"
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
              >
                <FileText className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select CSV File to Upload
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  or drag and drop mark sheet here
                </span>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>
        </div>

      </div>

      {/* CSV Import Feedback Messages */}
      {importStatus && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            importStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-800 dark:text-red-300'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold">{importStatus.message}</div>
            {importStatus.errors && importStatus.errors.length > 0 && (
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {importStatus.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Preview Parsed Data Before Committing */}
      {previewData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                Preview Parsed CSV Records ({previewData.length} Students)
              </h3>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                Verify the extracted student marks before committing to active database
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewData(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Commit & Import Mark Sheet
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Index</th>
                  <th className="py-2.5 px-3 font-semibold">Target Class</th>
                  {currentSubjects.map((s) => (
                    <th key={s.id} className="py-2.5 px-2.5 font-semibold text-center">
                      {s.shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.fullName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {row.indexNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      Gr.{row.grade}-{row.division}
                    </td>
                    {currentSubjects.map((s) => (
                      <td key={s.id} className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {row.terms[selectedTerm]?.marks[s.id] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
