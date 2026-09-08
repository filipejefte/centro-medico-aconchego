# Renderiza o cartão de compartilhamento (Open Graph, 1200x630) a partir de
# tools/og.html, com o Chrome em modo headless.
#
# Sobe um servidor estático temporário porque a página usa as fontes e o
# logotipo do site, e nada disso carrega por file://.
#
# Os ícones do site NÃO são gerados aqui: eles são recortados da arte oficial
# da clínica com precisão de pixel, e o resultado está versionado em
# assets/img/. Ver interno/NOTAS-INTERNAS.md.
#
#   powershell -ExecutionPolicy Bypass -File tools\imagens.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# Sem letra de unidade fixa no script: o caminho sai do ambiente.
$chrome = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) {
  $chrome = Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'
}
if (-not (Test-Path $chrome)) { throw 'Chrome nao encontrado.' }

$port = 5182
$img = Join-Path $root 'assets\img'
New-Item -ItemType Directory -Force $img | Out-Null

$srv = Start-Process python -ArgumentList '-m', 'http.server', "$port", '--bind', '127.0.0.1', '--directory', $root -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

function Render($pagina, $w, $h, $saida, $tag) {
  # Um perfil novo por captura: reaproveitar o mesmo trava a chamada seguinte.
  $perfil = Join-Path $PSScriptRoot "chrome-profile-$tag"
  if (Test-Path $perfil) { Remove-Item -Recurse -Force $perfil }

  & $chrome --headless=new --disable-gpu --hide-scrollbars "--window-size=$w,$h" `
    --force-color-profile=srgb --virtual-time-budget=15000 `
    "--user-data-dir=$perfil" "--screenshot=$saida" `
    "http://127.0.0.1:$port/tools/$pagina"

  # O lancador retorna antes de o PNG existir: esperar o Chrome desta captura sair.
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Milliseconds 500
    $vivo = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*chrome-profile-$tag*" }
    if (-not $vivo) { break }
  }
  Start-Sleep -Milliseconds 500
  Remove-Item -Recurse -Force $perfil -ErrorAction SilentlyContinue
  if (-not (Test-Path $saida) -or (Get-Item $saida).Length -lt 2000) { throw "Falha ao renderizar $pagina" }
}

try {
  Render 'og.html' 1200 630 (Join-Path $img 'og.png') 'og'
} finally {
  Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
}

Get-ChildItem $img | Select-Object Name, Length
