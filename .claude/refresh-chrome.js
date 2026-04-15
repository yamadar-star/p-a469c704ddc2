// PostToolUse hook: ポートフォリオ編集後にChromeを自動リフレッシュ
// stdin から編集されたファイル情報を受け取り、対象がポートフォリオなら Chrome を更新
const { exec } = require('child_process');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const json = JSON.parse(data);
    const raw = json.tool_input?.file_path || json.tool_response?.filePath || '';
    const filePath = raw.replace(/\\/g, '/');

    // ポートフォリオ内の .html/.css/.js のみ対象
    if (!filePath.includes('/portfolio/') || !/\.(html|css|js)$/.test(filePath)) return;

    if (filePath.endsWith('.html')) {
      // HTML編集 → そのファイルを Chrome で開く（既存タブがあればフォーカス）
      const url = 'file:///' + filePath.replace(/ /g, '%20');
      exec('start chrome "' + url + '"', () => {
        // 開いた後にリフレッシュ
        setTimeout(sendRefresh, 600);
      });
    } else {
      // CSS/JS編集 → 現在アクティブな Chrome タブをリフレッシュ
      sendRefresh();
    }
  } catch (e) { /* ignore */ }
});

function sendRefresh() {
  const ps = `powershell.exe -Command "$w = New-Object -ComObject WScript.Shell; $w.AppActivate('Chrome'); Start-Sleep -Milliseconds 300; $w.SendKeys('{F5}')"`;
  exec(ps);
}
