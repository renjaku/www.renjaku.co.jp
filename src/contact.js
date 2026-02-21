function rot13(s) {
  return s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
}

async function send(event) {
  event.preventDefault();

  const form = event.target;
  const fieldset = form.querySelector('fieldset');
  const name = form.querySelector('input[name=name]');
  const email = form.querySelector('input[name=email], input[type=email]');
  const message = form.querySelector('textarea[name=message], textarea');
  const category = form.querySelector('select[name=category]');

  if (!fieldset || !email || !message) {
    window.alert('フォームの構成が正しくありません。');
    return;
  }

  const validErrors = [];
  const nameValue = name?.value.trim() ?? '';
  const emailValue = email.value.trim();
  const messageValue = message.value.trim();
  const categoryValue = category?.value ?? '';
  const salesCategories = new Set(['proposal']);
  const sales = salesCategories.has(categoryValue);

  if (emailValue && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue))
    validErrors.push('メールアドレスの形式が正しくありません。');

  if (!messageValue)
    validErrors.push('メッセージをご記入ください。');

  if (!categoryValue)
    validErrors.push('お問い合わせ種別を選択してください。');

  if (validErrors.length > 0) {
    validErrors.forEach(x => window.alert(x));
    return;
  }

  if (
    !emailValue &&
    !window.confirm('メールアドレス未入力のまま送信します。よろしいですか？')
  ) return;

  const endpoint = rot13(
    sales ?
      'uggcf://qvfpbeq.pbz/ncv/jroubbxf/1444927091404701718/wKObdjrsl1D3tsz7Whzp6_QkDBqkwPQ42ILUjcKPdVVScEVdyehm74gTX821eQYViYoi' :
      'uggcf://qvfpbeq.pbz/ncv/jroubbxf/1444884058935922789/LIPs7aKFssswp-vsYQptXRAWGtDNz0y0cy2JmBZsV29dj8UdIVP2CIQVm2YW2hs8Zu5B'
  );

  const content = `
@everyone ${messageValue}

Name: ${nameValue || '(empty)'}
Reply-To: ${emailValue || '(empty)'}
Category: ${categoryValue || '(none)'}
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

    window.alert('送信が完了しました。内容を確認のうえ、ご連絡いたします。');
  } catch {
    window.alert('エラーが発生しました。時間をおいて再度お試しください。');
  } finally {
    fieldset.disabled = false;
  }
}

window.Contact = { send };
