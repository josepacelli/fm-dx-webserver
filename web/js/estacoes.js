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
  $(document).on('click', '#estacoes-add-row', function() {
    addEstacaoRow({
      nome: '',
      frequencia: '',
      pty: '',
      descricao: '',
      mensagem: ''
    });
  });

  // Delete row button
  $(document).on('click', '.estacoes-delete-btn', function() {
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
        mensagem: e.mensagem || ''
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

function addEstacaoRow(estacao, index) {
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
        <input type="text" class="estacao-descricao" value="${escapeHtml(estacao.descricao || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Descrição">
      </td>
      <td style="padding: 12px; border-right: 1px solid var(--color-2);">
        <input type="text" class="estacao-mensagem" value="${escapeHtml(estacao.mensagem || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--color-3); border-radius: 5px; background-color: var(--color-1);" placeholder="Mensagem de boas-vindas">
      </td>
      <td style="padding: 12px; text-align: center;">
        <button class="estacoes-delete-btn" style="padding: 6px 12px; border-radius: 5px; cursor: pointer; background-color: var(--color-3); color: var(--color-text);">
          <i class="fa-solid fa-trash"></i> Remover
        </button>
      </td>
    </tr>
  `;

  tbody.append(row);
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
      descricao: row.find('.estacao-descricao').val().trim(),
      mensagem: row.find('.estacao-mensagem').val().trim()
    };

    // Only add if at least one field is filled
    if (estacao.nome || estacao.frequencia || estacao.pty || estacao.descricao || estacao.mensagem) {
      estacoes.push(estacao);
    }
  });

  // Validate data
  if (estacoes.length === 0) {
    sendToast('warning', 'Atenção', 'Adicione pelo menos uma estação antes de salvar', true, true);
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
