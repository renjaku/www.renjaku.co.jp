function rot13(s) {
  return s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
}

async function send(event) {
  event.preventDefault();

  const fieldset = event.target.querySelector('fieldset');
  const email = event.target.querySelector('input[type=text]');
  const message = event.target.querySelector('textarea');
  const sales = event.target.querySelector('input[type=checkbox]');

  const validErrors = [];
  const emailValue = email.value.trim();
  const messageValue = message.value.trim();

  if (emailValue && emailValue.split('@').length != 2)
    validErrors.push('メールアドレスの形式に不備があります。');

  if (!messageValue)
    validErrors.push('問い合わせ内容を入力してください。');

  if (validErrors.length > 0) {
    validErrors.forEach(x => window.alert(x));
    return;
  }

  if (
    !emailValue &&
    !window.confirm('弊社からの返信を受け取るメールアドレスが入力されていませんが、よろしいですか？')
  ) return;

  const endpoint = rot13(
    sales.checked ?
      'uggcf://qvfpbeq.pbz/ncv/jroubbxf/1444927091404701718/wKObdjrsl1D3tsz7Whzp6_QkDBqkwPQ42ILUjcKPdVVScEVdyehm74gTX821eQYViYoi' :
      'uggcf://qvfpbeq.pbz/ncv/jroubbxf/1444884058935922789/LIPs7aKFssswp-vsYQptXRAWGtDNz0y0cy2JmBZsV29dj8UdIVP2CIQVm2YW2hs8Zu5B'
  );

  const content = `
@everyone ${messageValue}

Reply-To: ${emailValue}
`.trim();

  fieldset.disabled = true;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      window.alert(`HTTP Error: ${res.status}: ${res.statusText}`);
      return;
    }

    window.alert('送信が完了しました。内容を確認次第ご返信いたしますので、しばらくお待ちください。');
  } catch {
    window.alert('予期せぬエラーです。時間をおいて再度お試しください。');
  } finally {
    fieldset.disabled = false;
  }
}

window.Contact = { send };
