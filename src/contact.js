function rot13(s) {
  return s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
}

function send() {
  let email = document.querySelector('input[type=text]');
  let message = document.querySelector('textarea');

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

  let req = new XMLHttpRequest();
  req.open('POST', rot13('uggcf://qvfpbeq.pbz/ncv/jroubbxf/932997533146415195/jtRIrb_d030zHkuXXSC6p-aEp4eOyKDkBdVn9eJBMGnlh8ZSs7xy7-8XCpAcHnGKmWrG'));
  req.setRequestHeader('Content-Type', 'application/json');
  req.onload = () => window.alert('送信が完了しました。内容を確認次第ご返信いたしますので、しばらくお待ちください。');
  req.onerror = () =>
    window.alert('There was an error processing your request. ' +
                 'Please wait and try again later.');
  const content = `
@everyone ${messageValue}

Reply-To: ${emailValue}
`.trim();
  req.send(JSON.stringify({ content }));
}

window.Contact = { send };
