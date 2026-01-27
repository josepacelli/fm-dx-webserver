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
});

function openEstacoes() {
  $.ajax({
    url: './getEstacoes',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      // Format the JSON with proper indentation
      const jsonString = JSON.stringify(data, null, 2);
      $('#estacoes-editor').val(jsonString);

      // Show the popup
      togglePopup('#popup-panel-estacoes');
    },
    error: function(error) {
      console.error('Error loading estacoes:', error);
      sendToast('error', 'Erro', 'Não foi possível carregar o arquivo estacoes.json', true, true);
    }
  });
}

function saveEstacoes() {
  const editorContent = $('#estacoes-editor').val();

  try {
    // Validate JSON
    const jsonData = JSON.parse(editorContent);

    // Send to server
    $.ajax({
      url: './saveEstacoes',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(jsonData),
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
  } catch (e) {
    sendToast('error', 'Erro de JSON', 'O arquivo contém JSON inválido: ' + e.message, true, true);
  }
}
