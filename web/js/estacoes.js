$(document).ready(function() {
  // Open estacoes editor when clicking the container
  $('#estacoes-container').on('click keypress', function(e) {
    if (e.type === 'keypress' && e.key !== 'Enter') return;
    openEstacoes();
  });

  // Save estacoes when clicking save button
  $('#estacoes-save').on('click', function() {
    saveEstacoes();
  });

  // Add new row button
  $('#estacoes-add-row').on('click', function(e) {
    e.preventDefault();
    // Gather RDS/local UI values as defaults
    try {
      const freqRaw = ($('#data-frequency').text() || '').toString().trim();
      const cmdVal = ($('#commandinput').val && $('#commandinput').val()) ? $('#commandinput').val().toString().trim() : '';
      const freq = freqRaw || cmdVal;
      // station name may be in data-station-name or PS
      let nome = ($('#data-station-name').text() || '').toString().trim();
      const cidade = ($('#data-station-city').text() || '').toString().trim();
      const pty = ($('.data-pty').first().text() || '').toString().trim();
      // description often stored in data-ps title attribute
      const descricao = ($('#data-ps').attr('title') || $('#data-ps').text() || '').toString().trim();
      // message might be in #estacao-mensagem or in data on #data-ps
      let mensagem = '';
      const $estacaoMensagem = $('#estacao-mensagem');
      if ($estacaoMensagem.length) {
        mensagem = ($estacaoMensagem.text() || '').toString().trim();
      } else {
        const psData = $('#data-ps').data('estacao');
        if (psData && psData.mensagem) mensagem = psData.mensagem.toString().trim();
      }

      // If station name is empty, fallback to PS text
      if (!nome) nome = ($('#data-ps').text() || '').toString().trim();

      const defaults = { nome: nome || '', frequencia: freq || '', pty: pty || '', descricao: descricao || '', rt: mensagem || '' };
      console.log('[estacoes] add-row defaults ->', defaults);

      addEstacaoRow(defaults, undefined, true);
    } catch (e) {
      // Fallback to empty row if any error occurs
      console.error('[estacoes] error gathering RDS defaults for new row', e);
      addEstacaoRow({ nome: '', frequencia: '', pty: '', descricao: '', rt: '' });
    }
  });

  // Delete row button
  $('#estacoes-tbody').on('click', '.estacoes-delete-btn', function(e) {
    e.preventDefault();
    console.log('Remover clicado');
    $(this).closest('tr').remove();
  });
});

let estacoesList = [];

function openEstacoes() {
  $.ajax({
    url: './getEstacoes',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      // Normalize frequencia to string to avoid type inconsistencies
      estacoesList = Array.isArray(data) ? data.map(e => ({
        nome: e.nome || '',
        frequencia: (e.frequencia === undefined || e.frequencia === null) ? '' : String(e.frequencia),
        pty: e.pty || '',
        descricao: e.descricao || '',
        rt: e.rt || ''
      })) : [];

      populateEstacaoTable();

      // Show the popup
      togglePopup('#popup-panel-estacoes');
    },
    error: function(error) {
      console.error('Error loading estacoes:', error);
      sendToast('error', 'Erro', 'Não foi possível carregar o arquivo estacoes.json', true, true);
    }
  });
}

function populateEstacaoTable() {
  const tbody = $('#estacoes-tbody');
  tbody.empty();

  estacoesList.forEach((estacao, index) => {
    addEstacaoRow(estacao, index);
  });
}

function addEstacaoRow(estacao, index, showToast = false) {
  const tbody = $('#estacoes-tbody');
  const rowId = 'estacao-row-' + (index !== undefined ? index : Date.now());

  const row = `
    <tr id="${rowId}" style="border-bottom: 1px solid var(--color-2);">
      <td style="padding: 12px; border-right: 1px solid var(--color-2);">
        <input type="text" class="estacao-nome" value="${escapeHtml(estacao.nome || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Nome da estação">
      </td>
      <td style="padding: 12px; border-right: 1px solid var(--color-2);">
        <input type="text" class="estacao-frequencia" value="${escapeHtml(estacao.frequencia || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Ex: 102.7">
      </td>
      <td style="padding: 12px; border-right: 1px solid var(--color-2);">
        <input type="text" class="estacao-pty" value="${escapeHtml(estacao.pty || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Pop Music">
      </td>
      <td style="padding: 12px; border-right: 1px solid var(--color-2);">
        <input type="text" class="estacao-rt" value="${escapeHtml(estacao.rt || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Ligação de rádio">
      </td>
      <td style="padding: 12px; text-align: center;">
        <button class="estacoes-delete-btn" style="padding: 6px 12px; border-radius: 5px; cursor: pointer; background-color: var(--color-3); color: var(--color-text);">
          <i class="fa-solid fa-trash"></i> Remover
        </button>
      </td>
    </tr>
  `;

  tbody.append(row);
  console.log('[estacoes] appended row id=', rowId);
  try { console.log('[estacoes] new row html:', $('#' + rowId).prop('outerHTML')); } catch(e) { console.warn(e); }
  // Focus the newly added row's name input for visibility
  try {
    const $new = $('#' + rowId);
    $new.find('.estacao-nome').focus();
  } catch (e) {
    // ignore
  }
  // show toast feedback only when explicitly requested (new rows via Add button/console)
  try { if (showToast && typeof sendToast === 'function') sendToast('info', 'Linha adicionada', 'Nova estação adicionada (não salva)', true, true); } catch(e) {}
  return rowId;
}

// Helper to add from console using RDS defaults
if (typeof window !== 'undefined') {
  window.addEstacaoFromRds = function() {
    try {
      const defaults = window._getRdsDefaults ? window._getRdsDefaults() : null;
      if (defaults) {
        const rowId = addEstacaoRow(defaults, undefined, true);
        console.log('[estacoes] addEstacaoFromRds added:', defaults, 'rowId=' + rowId);
        return {defaults, rowId};
      } else {
        console.warn('[estacoes] addEstacaoFromRds: no defaults available, adding empty row');
        const rowId = addEstacaoRow({ nome: '', frequencia: '', pty: '', descricao: '', rt: '' });
        return {defaults: null, rowId};
      }
    } catch (e) {
      console.error('[estacoes] addEstacaoFromRds error', e);
      return null;
    }
  };
}

function saveEstacoes() {
  // Collect all rows from the table
  const rows = $('#estacoes-tbody tr');
  const estacoes = [];

  rows.each(function() {
    const row = $(this);
    const estacao = {
      nome: row.find('.estacao-nome').val().trim(),
      frequencia: row.find('.estacao-frequencia').val().trim(),
      pty: row.find('.estacao-pty').val().trim(),
      descricao: row.find('.estacao-descricao').val() || '',
      rt: row.find('.estacao-rt').val().trim()
    };

    // Only add if at least one field is filled
    if (estacao.nome || estacao.frequencia || estacao.pty || estacao.descricao || estacao.rt) {
      estacoes.push(estacao);
    }
  });

  // Validate data
  if (estacoes.length === 0) {
    sendToast('warning',
        'Atenção', 'Adicione pelo menos uma estação antes de salvar', true, true);
    return;
  }

  // Send to server
  $.ajax({
    url: './saveEstacoes',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(estacoes),
    success: function(response) {
      sendToast('success', 'Sucesso', 'Estações salvas com sucesso!', true, true);

      // Close the popup
      $('#popup-panel-estacoes').fadeOut(200);

      // Reload the page to reflect changes
      setTimeout(function() {
        location.reload();
      }, 1000);
    },
    error: function(error) {
      console.error('Error saving estacoes:', error);
      sendToast('error', 'Erro', 'Não foi possível salvar as estações', true, true);
    }
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Debug helper: returns the RDS-derived defaults the Add button uses
if (typeof window !== 'undefined') {
  window._getRdsDefaults = function() {
    try {
      const freqRaw = ($('#data-frequency').text() || '').toString().trim();
      const cmdVal = ($('#commandinput').val && $('#commandinput').val()) ? $('#commandinput').val().toString().trim() : '';
      const freq = freqRaw || cmdVal;
      let nome = ($('#data-station-name').text() || '').toString().trim();
      const cidade = ($('#data-station-city').text() || '').toString().trim();
      const pty = ($('.data-pty').first().text() || '').toString().trim();
      const descricao = ($('#data-ps').attr('title') || $('#data-ps').text() || '').toString().trim();
      let mensagem = '';
      // Tenta coletar RT de #data-rt0 ou do fallback dos dados armazenados
      const $dataRt0 = $('#data-rt0 span');
      if ($dataRt0.length) {
        mensagem = ($dataRt0.text() || '').toString().trim();
      } else {
        const psData = $('#data-ps').data('estacao');
        if (psData && psData.rt) mensagem = psData.rt.toString().trim();
      }
      if (!nome) nome = ($('#data-ps').text() || '').toString().trim();
      return { nome, frequencia: freq, cidade, pty, descricao, rt: mensagem };
    } catch (e) {
      console.error('[estacoes] _getRdsDefaults error', e);
      return null;
    }
  };
}
