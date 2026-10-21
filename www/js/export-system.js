// ============================================================
//  📤 EXPORT SYSTEM — نظام التصدير الموحّد
//  Excel (SheetJS) • PDF (jsPDF) • PNG (html2canvas) • CSV
// ============================================================

const EXPORT_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════
//  1) Excel (.xlsx) — SheetJS
// ═══════════════════════════════════════════════════════════
/**
 * تصدير بيانات إلى Excel
 * @param {Object} opts - { filename, sheets: [{ name, data, cols }] }
 *   - data: مصفوفة صفوف [ [r1c1, r1c2], [r2c1, r2c2] ]
 *   - cols: [{ wch: 20 }, ...] (اختياري - عرض الأعمدة)
 */
function exportToExcel(opts) {
    if (typeof XLSX === 'undefined') {
        alert('⚠️ مكتبة Excel غير محمّلة');
        return;
    }

    const { filename = 'تقرير', sheets = [] } = opts || {};
    if (sheets.length === 0) {
        alert('⚠️ لا توجد بيانات للتصدير');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();

        sheets.forEach(sh => {
            const ws = XLSX.utils.aoa_to_sheet(sh.data || []);

            // عرض الأعمدة
            if (sh.cols && Array.isArray(sh.cols)) {
                ws['!cols'] = sh.cols;
            }

            // عرض RTL
            ws['!dir'] = 'rtl';

            XLSX.utils.book_append_sheet(wb, ws, (sh.name || 'Sheet1').substring(0, 31));
        });

        const _filename = `${filename}_${_expDate()}.xlsx`;
        XLSX.writeFile(wb, _filename);

        if (typeof showToast === 'function') showToast('✅ تم تصدير Excel', 'success');
    } catch (e) {
        console.error('[export] Excel:', e);
        alert('⚠️ فشل التصدير: ' + e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  2) CSV — بلا مكتبة
// ═══════════════════════════════════════════════════════════
/**
 * تصدير بيانات إلى CSV
 * @param {Object} opts - { filename, data: [[r1c1, r1c2], ...] }
 */
function exportToCSV(opts) {
    const { filename = 'بيانات', data = [] } = opts || {};
    if (data.length === 0) {
        alert('⚠️ لا توجد بيانات');
        return;
    }

    try {
        // BOM للعربي في Excel
        let csv = '\uFEFF';

        data.forEach(row => {
            const line = row.map(cell => {
                let s = String(cell === null || cell === undefined ? '' : cell);
                // escape quotes
                s = s.replace(/"/g, '""');
                // wrap if needed
                if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
                    s = `"${s}"`;
                }
                return s;
            }).join(',');
            csv += line + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        _downloadBlob(blob, `${filename}_${_expDate()}.csv`);

        if (typeof showToast === 'function') showToast('✅ تم تصدير CSV', 'success');
    } catch (e) {
        console.error('[export] CSV:', e);
        alert('⚠️ فشل التصدير: ' + e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  3) PDF — jsPDF
// ═══════════════════════════════════════════════════════════
/**
 * تصدير جدول إلى PDF
 * @param {Object} opts - { filename, title, columns, rows, meta }
 *   - columns: ['الاسم', 'المبلغ', ...]
 *   - rows: [ ['أحمد', 5000], ... ]
 */
function exportToPDF(opts) {
    if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
        alert('⚠️ مكتبة PDF غير محمّلة');
        return;
    }

    const { jsPDF } = window.jspdf || window;
    const { filename = 'تقرير', title = 'تقرير', columns = [], rows = [], meta = {} } = opts || {};

    if (columns.length === 0 || rows.length === 0) {
        alert('⚠️ لا توجد بيانات');
        return;
    }

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // دعم العربية — يُحتاج خط عربي، لكن نستخدم نص بسيط
        doc.setFont('helvetica');
        doc.setFontSize(18);
        doc.text(title, 105, 20, { align: 'center' });

        // معلومات
        doc.setFontSize(10);
        let y = 30;
        if (meta.subtitle) {
            doc.text(meta.subtitle, 105, y, { align: 'center' });
            y += 7;
        }
        if (meta.date) {
            doc.text(`📅 ${meta.date}`, 105, y, { align: 'center' });
            y += 7;
        }

        y += 5;

        // رأس الجدول
        const pageW = 210;
        const margin = 15;
        const tableW = pageW - (margin * 2);
        const colW = tableW / columns.length;

        doc.setFillColor(52, 73, 94);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);

        columns.forEach((col, i) => {
            doc.rect(margin + (i * colW), y, colW, 8, 'F');
            doc.text(String(col).substring(0, 20), margin + (i * colW) + 2, y + 5.5);
        });

        y += 8;
        doc.setTextColor(0, 0, 0);

        // الصفوف
        rows.forEach((row, ri) => {
            // صفحة جديدة إذا لزم
            if (y > 275) {
                doc.addPage();
                y = 20;
                // رأس جديد
                doc.setFillColor(52, 73, 94);
                doc.setTextColor(255, 255, 255);
                columns.forEach((col, i) => {
                    doc.rect(margin + (i * colW), y, colW, 8, 'F');
                    doc.text(String(col).substring(0, 20), margin + (i * colW) + 2, y + 5.5);
                });
                y += 8;
                doc.setTextColor(0, 0, 0);
            }

            // zebra
            if (ri % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(margin, y, tableW, 7, 'F');
            }

            row.forEach((cell, i) => {
                doc.rect(margin + (i * colW), y, colW, 7);
                doc.text(String(cell).substring(0, 25), margin + (i * colW) + 2, y + 5);
            });

            y += 7;
        });

        // تذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('المدير AI — نظام محاسبة ذكي', 105, 290, { align: 'center' });

        doc.save(`${filename}_${_expDate()}.pdf`);

        if (typeof showToast === 'function') showToast('✅ تم تصدير PDF', 'success');
    } catch (e) {
        console.error('[export] PDF:', e);
        alert('⚠️ فشل التصدير: ' + e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  4) PNG — html2canvas
// ═══════════════════════════════════════════════════════════
/**
 * تصدير عنصر HTML إلى صورة PNG
 * @param {String} elementId - id العنصر
 * @param {String} filename - اسم الملف
 */
async function exportToPNG(elementId, filename = 'صورة') {
    if (typeof html2canvas === 'undefined') {
        alert('⚠️ مكتبة html2canvas غير محمّلة');
        return;
    }

    const el = document.getElementById(elementId);
    if (!el) { alert('⚠️ العنصر غير موجود'); return; }

    try {
        if (typeof showToast === 'function') showToast('⏳ جاري التصدير...', 'info');

        const canvas = await html2canvas(el, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        canvas.toBlob(blob => {
            _downloadBlob(blob, `${filename}_${_expDate()}.png`);
            if (typeof showToast === 'function') showToast('✅ تم تصدير PNG', 'success');
        });
    } catch (e) {
        console.error('[export] PNG:', e);
        alert('⚠️ فشل التصدير: ' + e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  5) واجهة موحّدة — قائمة منسدلة للتصدير
// ═══════════════════════════════════════════════════════════
/**
 * فتح قائمة التصدير لأي جدول
 * @param {Object} opts - { title, columns, rows, elementId, filename }
 */
function openExportMenu(opts) {
    const { title = 'بيانات', columns = [], rows = [], elementId, filename = 'تقرير' } = opts || {};

    // حذف أي قائمة قديمة
    const old = document.getElementById('exportMenuModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'exportMenuModal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.55); z-index:10001;
        display:flex; align-items:flex-end; justify-content:center;
        padding:0;
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
    <div style="
        background:white; border-radius:20px 20px 0 0; padding:20px;
        width:100%; max-width:520px;
        box-shadow:0 -5px 30px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    ">
        <div style="text-align:center; margin-bottom:15px;">
            <div style="width:40px; height:4px; background:#ddd; border-radius:2px; margin:0 auto 12px;"></div>
            <h3 style="margin:0; color:#2c3e50; font-size:16px;">📤 تصدير: ${_expEsc(title)}</h3>
            <div style="font-size:12px; color:#888; margin-top:4px;">${rows.length} صف</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
            <button onclick="window._doExport('excel');"
                style="padding:14px; background:#27ae60; color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600;">
                📊 Excel<br>
                <span style="font-size:11px; opacity:0.9;">xlsx - موصى به</span>
            </button>

            <button onclick="window._doExport('pdf');"
                style="padding:14px; background:#c0392b; color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600;">
                📄 PDF<br>
                <span style="font-size:11px; opacity:0.9;">مستند رسمي</span>
            </button>

            <button onclick="window._doExport('csv');"
                style="padding:14px; background:#2980b9; color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600;">
                📋 CSV<br>
                <span style="font-size:11px; opacity:0.9;">بيانات خام</span>
            </button>

            <button onclick="window._doExport('png');"
                style="padding:14px; background:#8e44ad; color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600;">
                📸 PNG<br>
                <span style="font-size:11px; opacity:0.9;">صورة</span>
            </button>
        </div>

        <button onclick="document.getElementById('exportMenuModal').remove();"
            style="width:100%; margin-top:12px; padding:12px; background:#ecf0f1; color:#555; border:none; border-radius:10px; cursor:pointer; font-size:14px;">
            ✕ إلغاء
        </button>
    </div>

    <style>
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
    </style>`;

    document.body.appendChild(modal);

    // تخزين البيانات
    window._exportData = { title, columns, rows, elementId, filename };
}

/**
 * تنفيذ التصدير (يُستدعى من الأزرار)
 */
function _doExport(type) {
    const { title, columns, rows, elementId, filename } = window._exportData || {};
    if (!rows || rows.length === 0) {
        alert('⚠️ لا توجد بيانات');
        return;
    }

    const modal = document.getElementById('exportMenuModal');
    if (modal) modal.remove();

    // بناء المصفوفة الكاملة (رأس + بيانات)
    const fullData = [columns, ...rows];

    switch (type) {
        case 'excel':
            exportToExcel({
                filename,
                sheets: [{
                    name: title.substring(0, 31),
                    data: fullData,
                    cols: columns.map((c, i) => ({
                        wch: i === 0 ? 20 : Math.max(12, String(c).length + 5)
                    }))
                }]
            });
            break;

        case 'pdf':
            exportToPDF({
                filename,
                title,
                columns,
                rows,
                meta: {
                    subtitle: title,
                    date: new Date().toLocaleDateString('ar-SY')
                }
            });
            break;

        case 'csv':
            exportToCSV({ filename, data: fullData });
            break;

        case 'png':
            if (elementId) {
                exportToPNG(elementId, filename);
            } else {
                alert('⚠️ لا يوجد عنصر للتصدير');
            }
            break;
    }
}

// ═══════════════════════════════════════════════════════════
//  6) أدوات مساعدة
// ═══════════════════════════════════════════════════════════
function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function _expDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _expEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ═══════════════════════════════════════════════════════════
//  7) استخراج الجدول من DOM (لأي جدول HTML)
// ═══════════════════════════════════════════════════════════
/**
 * استخراج بيانات جدول HTML
 * @param {String} tableId - id الجدول
 * @returns {Object} { columns, rows }
 */
function extractTableData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return { columns: [], rows: [] };

    const columns = [];
    const rows = [];

    // الرأس (أول صف th)
    const headerRow = table.querySelector('tr');
    if (headerRow) {
        headerRow.querySelectorAll('th').forEach(th => {
            columns.push((th.textContent || '').trim());
        });
    }

    // الصفوف
    table.querySelectorAll('tr').forEach((tr, idx) => {
        if (idx === 0 && tr.querySelector('th')) return; // تخطي الرأس
        const tds = tr.querySelectorAll('td');
        if (tds.length === 0) return;
        const row = [];
        tds.forEach(td => {
            row.push((td.textContent || '').trim());
        });
        rows.push(row);
    });

    return { columns, rows };
}

// ═══════════════════════════════════════════════════════════
//  تصدير للنافذة
// ═══════════════════════════════════════════════════════════
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;
window.exportToPNG = exportToPNG;
window.openExportMenu = openExportMenu;
window.extractTableData = extractTableData;
window._doExport = _doExport;

console.log('📤 [export] export-system.js v' + EXPORT_VERSION + ' محمّل');
