'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const formatBytes = bytes => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const CO_DATA = {
  CO1: {
    title: 'Recognize the Problem (Foundations)',
    desc: 'Understand e-waste management principles, recycling fundamentals, and environmental responsibility.'
  },
  CO2: {
    title: 'Read the Rules (Governance & EPR)',
    desc: 'Connect regulatory policy and Extended Producer Responsibility (EPR) to corporate compliance practices.'
  },
  CO3: {
    title: 'Question the Process (Recovery Tech)',
    desc: 'Study material recovery technologies, laser/molten-salt processing, and recycling monitoring tools.'
  },
  CO4: {
    title: 'Think in Systems (Impacts & Buildings)',
    desc: 'Analyse local and global environmental impacts, state trackers, LEED green buildings, and case studies.'
  },
  CO5: {
    title: 'Practise Everyday (Campaigns & Habits)',
    desc: 'Translate environmental knowledge into college campaigns, collection drives, and responsible disposal habits.'
  }
};

const statusLabels = {
  available: 'Files attached',
  partial: 'Partial files',
  empty: 'Awaiting files'
};

let assignments = structuredClone(window.SEED);
let group = 'all';
let co = '';
let current = null;
let editExistingFiles = [];
let editStagedFiles = [];
let db = null;

const toast = msg => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('visible'), 4000);
};

const requestResult = r => new Promise((resolve, reject) => {
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

async function initDB() {
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('circular-lab-v1', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('archive');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const saved = await requestResult(db.transaction('archive').objectStore('archive').get('assignments'));
  if (saved && Array.isArray(saved) && saved.length > 0) {
    assignments = saved;
  }
}

function persist(next) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Browser storage is unavailable. Use a local server and allow site storage.'));
    const tx = db.transaction('archive', 'readwrite');
    tx.objectStore('archive').put(next, 'assignments');
    tx.oncomplete = () => {
      assignments = next;
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
  });
}

function render() {
  const total = assignments.length;
  const covered = assignments.filter(a => a.files && a.files.length > 0).length;
  const totalFiles = assignments.reduce((sum, a) => sum + (a.files ? a.files.length : 0), 0);

  // Statistics
  $('#total').textContent = total;
  $('#available').textContent = covered;
  $('#empty').textContent = total - covered;
  $('#filecount').textContent = totalFiles;

  // Progress Bar
  $('#progress-label').textContent = `${covered} of ${total} activities have files attached`;
  const pct = total ? (covered / total) * 100 : 0;
  $('#progress-bar').style.width = pct + '%';
  const progressParent = $('#progress-bar').closest('.progress');
  if (progressParent) progressParent.setAttribute('aria-valuenow', Math.round(pct));

  // Active CO Banner
  const coBanner = $('#active-co-banner');
  if (co && CO_DATA[co]) {
    coBanner.hidden = false;
    $('#active-co-title').textContent = `${co} — ${CO_DATA[co].title}`;
    $('#active-co-desc').textContent = CO_DATA[co].desc;
    $('#co-filter').value = co;
  } else {
    coBanner.hidden = true;
    $('#co-filter').value = '';
  }

  // Filter & Search
  const q = $('#search').value.toLowerCase().trim();
  let result = assignments.filter(a => {
    const matchesGroup =
      group === 'all' ||
      (group === 'empty' && (!a.files || !a.files.length)) ||
      a.group === group;

    const matchesCO = !co || a.co === co;

    const fileNames = a.files ? a.files.map(f => f.name).join(' ') : '';
    const searchable = `${a.title} ${a.description} ${a.category} ${a.co} ${a.group} ${a.note || ''} ${fileNames}`.toLowerCase();
    const matchesSearch = !q || searchable.includes(q);

    return matchesGroup && matchesCO && matchesSearch;
  });

  // Sorting
  if ($('#sort').value === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    result.sort((a, b) => a.number - b.number);
  }

  // Render Cards
  const cardsContainer = $('#cards');
  if (result.length === 0) {
    cardsContainer.innerHTML = '';
    $('#no-results').hidden = false;
  } else {
    $('#no-results').hidden = true;
    cardsContainer.innerHTML = result.map(a => {
      const files = a.files || [];
      const img = files.find(f => ['png', 'jpg', 'jpeg', 'webp'].includes(f.type));
      const sym = ['↗', '◈', '⊕', '▤', '↻', '⌘', '§', '✳', '▱', '◎', '∿'][a.number % 11];

      const status = a.status || (files.length ? 'available' : 'empty');
      const statusLabel = statusLabels[status] || 'Files attached';
      const fileCountText = files.length === 1 ? '1 file attached' : `${files.length} files attached`;

      const displayDesc = a.description && a.description.trim()
        ? esc(a.description)
        : (files.length === 0 ? 'No files added yet. Upload your work for this assignment.' : 'No description provided.');

      const missingNotice = (status === 'partial' && a.note)
        ? `<div class="card-missing"><span class="missing-badge-mini">Missing component:</span> ${esc(a.note)}</div>`
        : '';

      return `
        <article class="card ${status === 'empty' ? 'card-empty' : ''}">
          <div class="card-cover cover-${a.number} ${!files.length ? 'empty-cover' : ''}">
            ${img ? `<img src="${esc(img.url)}" alt="${esc(a.title)}" loading="lazy">` : `
              <span class="cover-label">${esc((a.category || 'General').toUpperCase())}</span>
              <span class="cover-symbol" aria-hidden="true">${sym}</span>
              <span class="cover-number" aria-hidden="true">${String(a.number).padStart(2, '0')}</span>
            `}
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>ASSIGNMENT ${String(a.number).padStart(2, '0')}</span>
              <span>${esc(a.group)} · ${esc(a.co)}</span>
            </div>
            <h3 class="card-title">${esc(a.title)}</h3>
            <p class="card-desc">${displayDesc}</p>
            ${missingNotice}
            <div class="card-foot">
              <div class="card-foot-status">
                <span class="badge ${esc(status)}">${statusLabel}</span>
                <span class="file-summary">${fileCountText}</span>
              </div>
              <button class="card-action-btn ${!files.length ? 'action-upload' : ''}" data-open="${esc(a.id)}" aria-label="${files.length ? 'View assignment' : 'Upload assignment files'} ${esc(a.title)}">
                ${files.length ? '<span class="btn-icon">👁</span> View assignment' : '<span class="btn-icon">＋</span> Upload assignment files'}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }
}

function showDetail(id) {
  current = assignments.find(a => a.id === id);
  if (!current) return;

  const groupDesc = current.group === 'ISA' ? 'ISA (In-Semester Assessment)' : 'ESE (End-Semester Exam)';
  const coDesc = CO_DATA[current.co] ? `${current.co}: ${CO_DATA[current.co].title}` : current.co;

  $('#detail-kicker').textContent = `ASSIGNMENT ${String(current.number).padStart(2, '0')} · ${groupDesc} · ${coDesc}`;

  const files = current.files || [];
  const status = current.status || (files.length ? 'available' : 'empty');

  let bodyHtml = `
    <h2 class="detail-title">${esc(current.title)}</h2>
    <p class="detail-desc">${esc(current.description || 'No description provided for this coursework activity.')}</p>
  `;

  if (status === 'partial' && current.note) {
    bodyHtml += `
      <div class="detail-missing-alert">
        <strong>⚠️ Missing Component Notice:</strong>
        <p>${esc(current.note)}</p>
      </div>
    `;
  } else if (current.note) {
    bodyHtml += `
      <div class="context">
        <strong>Academic Context &amp; Submission Note:</strong>
        <p>${esc(current.note)}</p>
      </div>
    `;
  }

  if (files.length > 0) {
    bodyHtml += `
      <div class="file-selector-header">
        <label class="file-selector-label" id="file-tabs-label">Choose a file to preview:</label>
        <span class="file-count-badge">${files.length} resource${files.length === 1 ? '' : 's'} available</span>
      </div>
      <div class="file-tabs" role="tablist" aria-labelledby="file-tabs-label">
        ${files.map((f, i) => `
          <button role="tab" class="file-tab-btn ${i === 0 ? 'selected' : ''}" data-file="${i}" aria-selected="${i === 0}">
            <span class="file-type-chip">${esc(f.type.toUpperCase())}</span>
            <span class="file-name-text">${esc(f.name)}</span>
            <span class="file-size-text">(${formatBytes(f.size)})</span>
          </button>
        `).join('')}
      </div>
      <div class="preview-container">
        <div class="preview-mode-banner" id="preview-banner"></div>
        <div class="viewer" id="viewer"></div>
      </div>
      <div class="download-card" id="download-card"></div>
    `;
  } else {
    bodyHtml += `
      <div class="empty-detail-box">
        <div class="empty-icon-large" aria-hidden="true">📁</div>
        <h3>No files added yet. Upload your work for this assignment.</h3>
        <p>This assignment slot is awaiting your evidence files (PDF reports, Excel workbooks, Word docs, posters, presentations, or videos).</p>
        <button id="empty-upload-action" class="primary">
          <span class="btn-icon">＋</span> Upload assignment files now
        </button>
      </div>
    `;
  }

  const isSeed = window.SEED.some(a => a.id === id);
  bodyHtml += `
    <div class="detail-tools">
      <button id="edit-current" class="secondary">
        <span class="btn-icon">✎</span> Edit assignment and manage files
      </button>
      ${!isSeed ? `
        <button id="delete-current" class="danger">
          <span class="btn-icon">🗑</span> Delete custom assignment
        </button>
      ` : ''}
      <button id="detail-footer-close" class="secondary">✕ Close assignment</button>
    </div>
    <p class="detail-submission-disclaimer">
      File availability reflects coursework documents attached in this dashboard. It does not represent verified faculty grading, completion, or formal submission status.
    </p>
  `;

  $('#detail-body').innerHTML = bodyHtml;

  if (files.length > 0) {
    selectFile(0);
  }

  if (!$('#detail').open) {
    $('#detail').showModal();
  }

  // Detail event handlers
  $('#edit-current').onclick = () => {
    const editId = current.id;
    $('#detail').close();
    openEditor(editId);
  };

  const emptyUploadBtn = $('#empty-upload-action');
  if (emptyUploadBtn) {
    emptyUploadBtn.onclick = () => {
      const editId = current.id;
      $('#detail').close();
      openEditor(editId);
    };
  }

  $('#detail-footer-close').onclick = () => $('#detail').close();

  const delBtn = $('#delete-current');
  if (delBtn) {
    delBtn.onclick = async () => {
      if (!confirm(`Delete custom assignment "${current.title}" and its attached files from this browser?`)) return;
      try {
        await persist(assignments.filter(a => a.id !== current.id));
        $('#detail').close();
        render();
        toast('Custom assignment deleted from this browser.');
      } catch (err) {
        toast(err.message || 'Could not delete assignment.');
      }
    };
  }
}

function selectFile(i) {
  if (!current || !current.files || !current.files[i]) return;
  const f = current.files[i];
  const url = f.url;

  // Update tab styles
  $$('.file-tab-btn').forEach((btn, idx) => {
    const isSelected = idx === i;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-selected', isSelected);
  });

  const viewer = $('#viewer');
  const banner = $('#preview-banner');
  viewer.innerHTML = '';

  let bannerText = '';
  let el = null;

  if (['png', 'jpg', 'jpeg', 'webp'].includes(f.type)) {
    bannerText = '<strong>Image preview:</strong> Showing visual evidence graphic. Download the original file for full resolution.';
    el = document.createElement('img');
    el.alt = f.name;
    el.src = url;
    el.loading = 'lazy';
  } else if (f.type === 'mp4') {
    bannerText = '<strong>Video presentation:</strong> Showing MP4 creative campaign video. Use player controls to play.';
    el = document.createElement('video');
    el.controls = true;
    el.preload = 'metadata';
    el.src = url;
  } else if (f.preview || f.type === 'pdf') {
    const previewUrl = f.preview || url;
    if (f.previewKind === 'page preview' || f.type === 'pdf') {
      bannerText = '<strong>Page preview:</strong> Showing rendered pages of the original document. Download original file for full vector quality and searchable text.';
    } else {
      bannerText = '<strong>Text &amp; table preview:</strong> Extracted from the original document for in-browser reading. Original formatting, layout, formulas and styles are preserved in the downloadable original file.';
    }
    el = document.createElement('iframe');
    el.title = f.name;
    el.src = previewUrl;
    if (f.preview) {
      el.setAttribute('sandbox', 'allow-same-origin allow-downloads');
    }
  } else {
    bannerText = `<strong>Notice:</strong> In-browser preview is not available for this ${f.type.toUpperCase()} file.`;
    el = document.createElement('div');
    el.className = 'unsupported-preview-box';
    el.innerHTML = `
      <div class="unsupported-icon" aria-hidden="true">📄</div>
      <h3>In-browser preview is not available for this ${esc(f.type.toUpperCase())} file</h3>
      <p class="unsupported-desc">This file format (${esc(f.name)}) requires its native application to view all formatting, equations, formulas and visuals correctly.</p>
      <a class="primary download-file-btn" href="${esc(url)}" download="${esc(f.name)}">
        <span class="btn-icon">↓</span> Download original file (${esc(f.name)} · ${formatBytes(f.size)})
      </a>
    `;
  }

  banner.innerHTML = `<span class="banner-icon" aria-hidden="true">ℹ</span><span>${bannerText}</span>`;
  viewer.appendChild(el);

  // Update download card
  $('#download-card').innerHTML = `
    <div class="download-card-inner">
      <div class="download-info">
        <span class="download-kicker">Original file resource:</span>
        <strong class="download-filename">${esc(f.name)}</strong>
        <span class="download-meta">${esc(f.type.toUpperCase())} Document · ${formatBytes(f.size)}</span>
      </div>
      <a class="primary download-file-btn" href="${esc(url)}" download="${esc(f.name)}">
        <span class="btn-icon">↓</span> Download original file
      </a>
    </div>
  `;
}

function renderEditorFiles() {
  const existingContainer = $('#existing-files-list');
  const stagedContainer = $('#staged-files-list');

  // Currently attached files
  if (editExistingFiles.length === 0) {
    existingContainer.innerHTML = '<p class="no-files-hint">No existing files currently attached to this assignment.</p>';
  } else {
    existingContainer.innerHTML = `
      <h4 class="file-group-heading">Currently attached files (${editExistingFiles.length})</h4>
      ${editExistingFiles.map((f, i) => `
        <div class="editor-file-row">
          <span class="file-pill">${esc(f.type.toUpperCase())}</span>
          <div class="file-row-details">
            <strong class="file-row-name">${esc(f.name)}</strong>
            <small class="file-row-size">${formatBytes(f.size)}</small>
          </div>
          <button type="button" class="file-remove-btn" data-remove-existing="${i}" aria-label="Remove ${esc(f.name)}">
            ✕ Remove
          </button>
        </div>
      `).join('')}
    `;
  }

  // Staged newly selected files
  if (editStagedFiles.length === 0) {
    stagedContainer.innerHTML = '';
  } else {
    stagedContainer.innerHTML = `
      <h4 class="file-group-heading staged-heading">New files ready to save (${editStagedFiles.length})</h4>
      ${editStagedFiles.map((f, i) => `
        <div class="editor-file-row staged-row">
          <span class="file-pill staged-pill">${esc(f.name.split('.').pop().toUpperCase())}</span>
          <div class="file-row-details">
            <strong class="file-row-name">${esc(f.name)}</strong>
            <small class="file-row-size">${formatBytes(f.size)} · Ready to upload</small>
          </div>
          <button type="button" class="file-remove-btn" data-remove-staged="${i}" aria-label="Remove ${esc(f.name)}">
            ✕ Remove
          </button>
        </div>
      `).join('')}
    `;
  }
}

function openEditor(id) {
  const a = id ? assignments.find(x => x.id === id) : null;
  const f = $('#edit-form');
  f.reset();

  $('#form-error').hidden = true;
  $('#form-error').textContent = '';

  $('#editor-title').textContent = a ? `Edit assignment ${String(a.number).padStart(2, '0')}: ${a.title}` : 'Add a new assignment';

  for (const key of ['id', 'title', 'category', 'group', 'description', 'co', 'note', 'status']) {
    if (f.elements[key]) {
      f.elements[key].value = a ? (a[key] ?? '') : ({ group: 'ESE', co: 'CO1', status: 'available' }[key] || '');
    }
  }

  editExistingFiles = a && a.files ? structuredClone(a.files) : [];
  editStagedFiles = [];

  renderEditorFiles();
  $('#editor').showModal();
}

const readData = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

// File picker change (staged files)
$('#field-uploads').onchange = e => {
  const picked = [...e.target.files];
  for (const f of picked) {
    if (!editStagedFiles.some(s => s.name === f.name && s.size === f.size)) {
      editStagedFiles.push(f);
    }
  }
  e.target.value = '';
  renderEditorFiles();
};

// Form submission
$('#edit-form').onsubmit = async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const submitBtn = $('#save-btn');
  const btnText = $('#save-btn-text');
  const errBox = $('#form-error');

  errBox.hidden = true;
  errBox.textContent = '';
  submitBtn.disabled = true;
  btnText.textContent = 'Saving assignment…';

  try {
    const title = form.elements.title.value.trim();
    const category = form.elements.category.value.trim();

    if (!title || !category) {
      throw new Error('Assignment title and category are required.');
    }

    const allowed = /\.(pdf|png|jpe?g|webp|mp4|docx|pptx|xlsx|txt)$/i;
    for (const f of editStagedFiles) {
      if (!allowed.test(f.name)) {
        throw new Error(`File "${f.name}" has an unsupported format. Supported formats: PDF, PNG, JPG, JPEG, WEBP, MP4, DOCX, PPTX, XLSX, TXT.`);
      }
    }

    const stagedBytes = editStagedFiles.reduce((sum, f) => sum + f.size, 0);
    if (stagedBytes > 150 * 1024 * 1024) {
      throw new Error(`Total size of selected files (${formatBytes(stagedBytes)}) exceeds the 150 MB limit.`);
    }

    // Convert staged files
    const newFiles = await Promise.all(editStagedFiles.map(async f => ({
      name: f.name,
      type: f.name.split('.').pop().toLowerCase(),
      size: f.size,
      url: await readData(f)
    })));

    const finalFiles = [...editExistingFiles, ...newFiles];

    const id = form.elements.id.value || crypto.randomUUID();
    const previous = assignments.find(a => a.id === id);
    const nextNumber = previous?.number ?? (Math.max(-1, ...assignments.map(a => a.number)) + 1);

    const a = {
      id,
      number: nextNumber,
      title,
      category,
      group: form.elements.group.value,
      co: form.elements.co.value,
      description: form.elements.description.value.trim(),
      note: form.elements.note.value.trim(),
      files: finalFiles
    };

    if (finalFiles.length === 0) {
      a.status = 'empty';
    } else {
      a.status = form.elements.status.value === 'empty' ? 'available' : form.elements.status.value;
    }

    const nextAssignments = previous
      ? assignments.map(x => x.id === id ? a : x)
      : [...assignments, a];

    await persist(nextAssignments);
    render();
    $('#editor').close();
    toast('Assignment saved successfully in this browser. Download a backup to keep a copy.');
  } catch (err) {
    errBox.textContent = err.message || 'Could not save assignment. Check browser storage permissions.';
    errBox.hidden = false;
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Save assignment';
  }
};

// Global click handling
document.addEventListener('click', e => {
  // Open assignment detail
  const openBtn = e.target.closest('[data-open]');
  if (openBtn) {
    showDetail(openBtn.dataset.open);
    return;
  }

  // Switch preview file in detail dialog
  const fileTab = e.target.closest('[data-file]');
  if (fileTab) {
    selectFile(Number(fileTab.dataset.file));
    return;
  }

  // Remove existing file in editor
  const remExisting = e.target.closest('[data-remove-existing]');
  if (remExisting) {
    editExistingFiles.splice(Number(remExisting.dataset.removeExisting), 1);
    renderEditorFiles();
    return;
  }

  // Remove staged file in editor
  const remStaged = e.target.closest('[data-remove-staged]');
  if (remStaged) {
    editStagedFiles.splice(Number(remStaged.dataset.removeStaged), 1);
    renderEditorFiles();
    return;
  }

  // Category tabs
  const tabFilter = e.target.closest('[data-group]');
  if (tabFilter) {
    group = tabFilter.dataset.group;
    $$('[data-group]').forEach(b => {
      const isSel = b === tabFilter;
      b.classList.toggle('selected', isSel);
      b.setAttribute('aria-selected', isSel);
    });
    render();
    return;
  }

  // Learning journey Course Outcome links
  const coLink = e.target.closest('[data-co]');
  if (coLink) {
    co = coLink.dataset.co;
    group = 'all';
    $('#search').value = '';
    $$('[data-group]').forEach(b => {
      const isAll = b.dataset.group === 'all';
      b.classList.toggle('selected', isAll);
      b.setAttribute('aria-selected', isAll);
    });
    render();
    toast(`Filtered by ${co}: ${CO_DATA[co]?.title || co}.`);
    return;
  }
});

// Close dialog buttons
$('#detail-close-btn').onclick = () => $('#detail').close();
$('#editor-close-btn').onclick = () => $('#editor').close();
$('#editor-cancel-btn').onclick = () => $('#editor').close();

// Close on backdrop click
$$('dialog').forEach(d => {
  d.addEventListener('click', e => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        d.close();
      }
    }
  });
});

// Search, Filter & Sort inputs
$('#search').oninput = render;
$('#sort').onchange = render;

$('#co-filter').onchange = e => {
  co = e.target.value;
  render();
};

$('#clear-co-btn').onclick = () => {
  co = '';
  render();
  toast('Course Outcome filter removed. Showing all assignments.');
};

// Clear all search and filters
$('#clear').onclick = () => {
  group = 'all';
  co = '';
  $('#search').value = '';
  $('#sort').value = 'original';
  $('#co-filter').value = '';
  $$('[data-group]').forEach(b => {
    const isAll = b.dataset.group === 'all';
    b.classList.toggle('selected', isAll);
    b.setAttribute('aria-selected', isAll);
  });
  render();
  toast('Search and filters cleared.');
};

// Add new assignment
$('#add').onclick = () => openEditor();

// Featured study & poster buttons
$('#featured').onclick = () => showDetail('4');
$('#poster').onclick = () => showDetail('4');

// Layout Toggle (List / Grid)
$('#layout').onclick = () => {
  const isList = $('#cards').classList.toggle('list');
  $('#layout').setAttribute('aria-pressed', isList);
  $('#layout-icon').textContent = isList ? '▦' : '☷';
  $('#layout-label').textContent = isList ? 'Grid view' : 'List view';
};

// Theme Management
function updateThemeUI() {
  const isDark = document.body.classList.contains('dark');
  const label = $('#theme-label');
  const icon = $('#theme .theme-icon');
  if (label) label.textContent = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

try {
  if (localStorage.getItem('circular-theme') === 'dark') {
    document.body.classList.add('dark');
  }
} catch {}
updateThemeUI();

$('#theme').onclick = () => {
  const isDark = document.body.classList.toggle('dark');
  try {
    localStorage.setItem('circular-theme', isDark ? 'dark' : 'light');
  } catch {}
  updateThemeUI();
  toast(isDark ? 'Switched to dark mode.' : 'Switched to light mode.');
};

// Export Backup
function exportBackup() {
  const backupData = {
    format: 'circular-lab-backup',
    version: 1,
    exported: new Date().toISOString(),
    assignments
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'circular-lab-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Dashboard backup downloaded. Keep this file with your project ZIP.');
}

$('#export').onclick = exportBackup;
const exportBottom = $('#export-bottom');
if (exportBottom) exportBottom.onclick = exportBackup;

// Import Backup
$('#import').onclick = () => $('#importfile').click();

function validateBackup(data) {
  if (data.format !== 'circular-lab-backup' || data.version !== 1 || !Array.isArray(data.assignments) || data.assignments.length > 500) {
    throw new Error('Not a valid Circular Lab backup file.');
  }
  const ids = new Set();
  const numbers = new Set();

  for (const a of data.assignments) {
    if (!a || typeof a.id !== 'string' || ids.has(a.id) || !Number.isSafeInteger(a.number) || a.number < 0 || numbers.has(a.number)) {
      throw new Error('Backup contains invalid assignment IDs or numbers.');
    }
    if (!['ISA', 'ESE'].includes(a.group)) {
      throw new Error(`Invalid assessment group in assignment "${a.title || a.number}". Must be ISA or ESE.`);
    }
    if (!['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].includes(a.co)) {
      throw new Error(`Invalid Course Outcome in assignment "${a.title || a.number}". Must be CO1–CO5.`);
    }
    if (!Array.isArray(a.files)) {
      throw new Error(`Assignment "${a.title || a.number}" has invalid file records.`);
    }

    ids.add(a.id);
    numbers.add(a.number);

    for (const f of a.files) {
      if (!f || typeof f.name !== 'string' || typeof f.type !== 'string' || !Number.isFinite(f.size) || f.size < 0 || typeof f.url !== 'string') {
        throw new Error('Backup contains invalid file properties.');
      }
      const seedUrls = window.SEED.flatMap(x => (x.files || []).map(sf => sf.url));
      if (!seedUrls.includes(f.url) && !/^data:(application\/(pdf|octet-stream|vnd\.[a-zA-Z0-9.+-]+)|image\/(png|jpeg|webp)|video\/mp4|text\/plain);base64,[A-Za-z0-9+/=\r\n]*$/.test(f.url)) {
        throw new Error(`Unsupported or invalid file URL in file "${f.name}".`);
      }
    }

    if (!a.files.length) {
      a.status = 'empty';
    }
  }
  return data.assignments;
}

$('#importfile').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = validateBackup(JSON.parse(text));
    if (!confirm('Restore dashboard backup? This will replace your current browser archive with the contents of the backup file. Export your current backup first if you want to keep it.')) {
      return;
    }
    await persist(rows);
    render();
    toast('Dashboard backup restored successfully.');
  } catch (err) {
    toast(err.message || 'Could not restore backup. Please check file format.');
  } finally {
    e.target.value = '';
  }
};

// Active section observer for navigation
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      $$('nav a').forEach(a => {
        a.classList.toggle('active', a.hash === '#' + entry.target.id);
      });
    }
  }
}, { rootMargin: '-10% 0px -60% 0px' });

$$('main > section[id]').forEach(s => observer.observe(s));

// Initial render & DB initialization
render();
initDB()
  .then(render)
  .catch(() => toast('Browser storage unavailable. Bundled static archive remains readable.'));
