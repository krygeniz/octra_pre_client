// Helper: Show spinner
function showSpinner(id) { $(id).show(); }
function hideSpinner(id) { $(id).hide(); }

// UI helpers for alerts and JSON display
function showAlert(id, message, type = 'success') {
  const alert = $(id);
  alert.removeClass('d-none alert-success alert-danger alert-info')
       .addClass('alert-' + type)
       .html(message)
       .fadeIn(200);
}
function hideAlert(id) {
  $(id).addClass('d-none').hide();
}
function showPre(id, data) {
  const pre = $(id);
  pre.removeClass('d-none').show();
  const code = pre.find('code');
  code.text(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  if (window.hljs) hljs.highlightElement(code[0]);
}
function hidePre(id) {
  $(id).addClass('d-none').hide().find('code').text('');
}
function showResultCombo(alertId, preId, message, data, type = 'success', timeMs) {
  if (message) showAlert(alertId, message + (timeMs ? `<br><small>Time: ${timeMs} ms</small>` : ''), type);
  else hideAlert(alertId);
  if (data) showPre(preId, data);
  else hidePre(preId);
}

// Modal helpers
function showModal(title, content) {
  $('#modalSensitiveLabel').text(title);
  const code = $('#modalSensitiveContent');
  code.text(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  if (window.hljs) hljs.highlightElement(code[0]);
  var modal = new bootstrap.Modal(document.getElementById('modalSensitive'));
  modal.show();
}
$('#copy-modal-btn').click(function() {
  const text = $('#modalSensitiveContent').text();
  navigator.clipboard.writeText(text).then(() => {
    $(this).text('Copied!').addClass('btn-success').removeClass('btn-outline-secondary');
    setTimeout(() => {
      $(this).text('Copy').removeClass('btn-success').addClass('btn-outline-secondary');
    }, 1200);
  });
});

function formatTxTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}
function badgeType(type) {
  if (type === 'in') return '<span class="badge bg-success">IN</span>';
  if (type === 'out') return '<span class="badge bg-danger">OUT</span>';
  return `<span class="badge bg-secondary">${type}</span>`;
}
function badgeStatus(tx) {
  if (tx.ok && tx.epoch) return `<span class="badge bg-success">Confirmed</span> <span class="badge bg-info">e${tx.epoch}</span>`;
  if (tx.ok) return '<span class="badge bg-warning text-dark">Pending</span>';
  return '<span class="badge bg-secondary">Unknown</span>';
}
function decodeMsg(msg) {
  if (!msg) return '';
  try {
    // Try to decode as hex string
    if (/^[0-9a-fA-F]+$/.test(msg)) {
      let str = '';
      for (let i = 0; i < msg.length; i += 2) {
        str += String.fromCharCode(parseInt(msg.substr(i, 2), 16));
      }
      return str;
    }
    return msg;
  } catch { return msg; }
}

function renderHistoryTable(txs) {
  console.log('renderHistoryTable called with:', txs);
  const tbody = $('#history-table tbody');
  tbody.empty();
  if (!txs || txs.length === 0) {
    tbody.append('<tr><td colspan="6" class="text-center text-muted">No transactions found.</td></tr>');
    return;
  }
  txs.forEach((tx, idx) => {
    const row = $(`
      <tr>
        <td>${formatTxTime(tx.time)}</td>
        <td>${badgeType(tx.type)}</td>
        <td>${tx.amt}</td>
        <td><span class="badge bg-light text-dark">${tx.to || ''}</span></td>
        <td>${badgeStatus(tx)}</td>
        <td><button class="btn btn-sm btn-outline-info view-tx-btn" data-idx="${idx}">View Details</button></td>
      </tr>
    `);
    tbody.append(row);
  });
  console.log('renderHistoryTable finished rendering');
}

function showTxDetails(tx) {
  let html = `<div class="mb-2"><b>Hash:</b> <span class="badge bg-secondary">${tx.hash}</span></div>`;
  html += `<div class="mb-2"><b>Time:</b> ${formatTxTime(tx.time)}</div>`;
  html += `<div class="mb-2"><b>Type:</b> ${badgeType(tx.type)}</div>`;
  html += `<div class="mb-2"><b>Amount:</b> <span class="badge bg-dark">${tx.amt}</span></div>`;
  html += `<div class="mb-2"><b>Address:</b> <span class="badge bg-light text-dark">${tx.to || ''}</span></div>`;
  html += `<div class="mb-2"><b>Status:</b> ${badgeStatus(tx)}</div>`;
  html += `<div class="mb-2"><b>Nonce:</b> ${tx.nonce ?? ''}</div>`;
  html += `<div class="mb-2"><b>Epoch:</b> ${tx.epoch ?? ''}</div>`;
  if (tx.msg) {
    html += `<div class="mb-2"><b>Message:</b> <span class="badge bg-info">${decodeMsg(tx.msg)}</span></div>`;
  }
  html += `<div class="mb-2"><b>Raw JSON:</b></div><pre><code class="json">${JSON.stringify(tx, null, 2)}</code></pre>`;
  $('#tx-details-content').html(html);
  if (window.hljs) $('#tx-details-content code.json').each((i, el) => hljs.highlightElement(el));
  $('#txDetailsModal').modal('show');
}

function fetchAndRenderHistory() {
  console.log('fetchAndRenderHistory called');
  $('#history-spinner').show();
  console.log('Spinner shown');
  $('#history-alert').addClass('d-none').hide();
  $('#history-table tbody').empty();
  $.get('/history', function(data) {
    console.log('Received /history data:', data);
    renderHistoryTable(data);
    $('#history-spinner').hide();
    console.log('Spinner hidden');
    if (!data || data.length === 0) {
      $('#history-alert').removeClass('d-none alert-danger').addClass('alert-info').text('No transactions found.').fadeIn(200);
    }
  }).fail(function(xhr) {
    $('#history-spinner').hide();
    console.log('Error fetching /history:', xhr);
    $('#history-alert').removeClass('d-none alert-info').addClass('alert-danger').text('Failed to load history: ' + (xhr.responseText || xhr.statusText)).fadeIn(200);
  });
}

// On page load, fetch history
$(document).ready(function() {
  console.log('Document ready, calling fetchAndRenderHistory');
  fetchAndRenderHistory();
});
// Refresh button
$('#refresh-history-btn').click(function() {
  fetchAndRenderHistory();
});
// View Details button
$(document).on('click', '.view-tx-btn', function() {
  const idx = $(this).data('idx');
  $.get('/history', function(data) {
    if (data && data[idx]) showTxDetails(data[idx]);
  });
});
// Copy details in modal
$('#copy-tx-details-btn').click(function() {
  const text = $('#tx-details-content').text();
  navigator.clipboard.writeText(text).then(() => {
    $(this).text('Copied!').addClass('btn-success').removeClass('btn-outline-secondary');
    setTimeout(() => {
      $(this).text('Copy Details').removeClass('btn-success').addClass('btn-outline-secondary');
    }, 1200);
  });
});

// Get Balance
$('#get-balance-btn').click(function() {
  showSpinner('#balance-spinner');
  showResultCombo('#balance-alert', '#balance-pre', '', '', 'success');
  const t0 = performance.now();
  $.get('/balance', function(data) {
    showResultCombo('#balance-alert', '#balance-pre', 'Balance fetched successfully!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#balance-alert', '#balance-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#balance-spinner');
  });
});

// Send Transaction
$('#send-tx-btn').click(function() {
  showSpinner('#send-spinner');
  showResultCombo('#send-alert', '#send-pre', '', '', 'success');
  const to = $('#send-to').val();
  const amount = $('#send-amount').val();
  const msg = $('#send-msg').val();
  const t0 = performance.now();
  $.post(`/send?to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&msg=${encodeURIComponent(msg)}`, function(data) {
    showResultCombo('#send-alert', '#send-pre', 'Transaction sent!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#send-alert', '#send-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#send-spinner');
  });
});

// Multi Send
let multiRecipients = [];
$('#add-multi-btn').click(function() {
  const to = $('#multi-to').val();
  const amount = $('#multi-amount').val();
  if (to && amount) {
    multiRecipients.push({to, amount});
    $('#multi-send-list').append(`<div>${to} - ${amount} <button class='btn btn-sm btn-danger remove-multi' data-idx='${multiRecipients.length-1}'>Remove</button></div>`);
    $('#multi-to').val('');
    $('#multi-amount').val('');
  }
});
$(document).on('click', '.remove-multi', function() {
  const idx = $(this).data('idx');
  multiRecipients[idx] = null;
  $(this).parent().remove();
});
$('#multi-send-btn').click(function() {
  showSpinner('#multi-spinner');
  showResultCombo('#multi-alert', '#multi-pre', '', '', 'success');
  const recipients = multiRecipients.filter(x => x);
  if (recipients.length === 0) {
    showResultCombo('#multi-alert', '#multi-pre', 'No recipients.', '', 'info');
    hideSpinner('#multi-spinner');
    return;
  }
  const toArr = recipients.map(x => x.to);
  const amtArr = recipients.map(x => x.amount);
  const t0 = performance.now();
  $.ajax({
    url: `/multi_send?${toArr.map((to, i) => `recipients=${encodeURIComponent(to)}&amounts=${encodeURIComponent(amtArr[i])}`).join('&')}`,
    method: 'POST',
    success: function(data) {
      showResultCombo('#multi-alert', '#multi-pre', 'Multi-send complete!', data, 'success', Math.round(performance.now() - t0));
    },
    error: function(xhr) {
      showResultCombo('#multi-alert', '#multi-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
    },
    complete: function() { hideSpinner('#multi-spinner'); multiRecipients = []; $('#multi-send-list').empty(); }
  });
});

// Encrypt Balance
$('#encrypt-btn').click(function() {
  showSpinner('#encrypt-spinner');
  showResultCombo('#encrypt-alert', '#encrypt-pre', '', '', 'success');
  const amount = $('#encrypt-amount').val();
  const t0 = performance.now();
  $.post(`/encrypt_balance?amount=${encodeURIComponent(amount)}`, function(data) {
    showResultCombo('#encrypt-alert', '#encrypt-pre', 'Balance encrypted!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#encrypt-alert', '#encrypt-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#encrypt-spinner');
  });
});

// Decrypt Balance
$('#decrypt-btn').click(function() {
  showSpinner('#decrypt-spinner');
  showResultCombo('#decrypt-alert', '#decrypt-pre', '', '', 'success');
  const amount = $('#decrypt-amount').val();
  const t0 = performance.now();
  $.post(`/decrypt_balance?amount=${encodeURIComponent(amount)}`, function(data) {
    showResultCombo('#decrypt-alert', '#decrypt-pre', 'Balance decrypted!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#decrypt-alert', '#decrypt-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#decrypt-spinner');
  });
});

// Private Transfer
$('#private-btn').click(function() {
  showSpinner('#private-spinner');
  showResultCombo('#private-alert', '#private-pre', '', '', 'success');
  const to = $('#private-to').val();
  const amount = $('#private-amount').val();
  const t0 = performance.now();
  $.post(`/private_transfer?to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`, function(data) {
    showResultCombo('#private-alert', '#private-pre', 'Private transfer sent!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#private-alert', '#private-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#private-spinner');
  });
});

// Claim Transfer
$('#claim-btn').click(function() {
  showSpinner('#claim-spinner');
  showResultCombo('#claim-alert', '#claim-pre', '', '', 'success');
  const transfer_id = $('#claim-id').val();
  const t0 = performance.now();
  $.post(`/claim_transfer?transfer_id=${encodeURIComponent(transfer_id)}`, function(data) {
    showResultCombo('#claim-alert', '#claim-pre', 'Transfer claimed!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#claim-alert', '#claim-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#claim-spinner');
  });
});

// Export Keys
$('#export-btn').click(function() {
  showSpinner('#export-spinner');
  showResultCombo('#export-alert', '', '', '', 'success');
  const t0 = performance.now();
  $.get('/export_keys', function(data) {
    showModal('Exported Keys', data);
    showAlert('#export-alert', 'Keys exported! <small>See modal for details.</small>', 'info');
  }).fail(function(xhr) {
    showAlert('#export-alert', xhr.responseText || xhr.statusText, 'danger');
  }).always(function() {
    hideSpinner('#export-spinner');
  });
});

// Wallet Config (GET)
$('#get-wallet-btn').click(function() {
  showSpinner('#wallet-spinner');
  showResultCombo('#wallet-alert', '#wallet-pre', '', '', 'success');
  const t0 = performance.now();
  $.get('/wallet_config', function(data) {
    showResultCombo('#wallet-alert', '#wallet-pre', 'Wallet config loaded!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#wallet-alert', '#wallet-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#wallet-spinner');
  });
});
// Wallet Config (GET with priv)
$('#get-wallet-priv-btn').click(function() {
  showSpinner('#wallet-spinner');
  showResultCombo('#wallet-alert', '#wallet-pre', '', '', 'success');
  const t0 = performance.now();
  $.get('/wallet_config/with_priv', function(data) {
    showModal('Wallet Config (with Private Key)', data);
    showAlert('#wallet-alert', 'Wallet config (with private key) loaded! <small>See modal for details.</small>', 'info');
  }).fail(function(xhr) {
    showAlert('#wallet-alert', xhr.responseText || xhr.statusText, 'danger');
  }).always(function() {
    hideSpinner('#wallet-spinner');
  });
});
// Wallet Config (POST)
$('#update-wallet-btn').click(function() {
  showSpinner('#wallet-spinner');
  showResultCombo('#wallet-alert', '#wallet-pre', '', '', 'success');
  const priv = $('#wallet-priv').val();
  const addr = $('#wallet-addr').val();
  const rpc = $('#wallet-rpc').val();
  let url = '/wallet_config?';
  if (priv) url += `priv=${encodeURIComponent(priv)}&`;
  if (addr) url += `addr=${encodeURIComponent(addr)}&`;
  if (rpc) url += `rpc=${encodeURIComponent(rpc)}&`;
  const t0 = performance.now();
  $.post(url, function(data) {
    showResultCombo('#wallet-alert', '#wallet-pre', 'Wallet config updated!', data, 'success', Math.round(performance.now() - t0));
  }).fail(function(xhr) {
    showResultCombo('#wallet-alert', '#wallet-pre', xhr.responseText || xhr.statusText, '', 'danger', Math.round(performance.now() - t0));
  }).always(function() {
    hideSpinner('#wallet-spinner');
    $('#wallet-priv').val('');
    $('#wallet-addr').val('');
    $('#wallet-rpc').val('');
  });
}); 
