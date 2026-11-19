$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Host "Porta $port ocupada ou indisponivel: $_"; Read-Host 'Enter para sair'; exit 1 }
Start-Process "http://localhost:$port/"
Write-Host 'Salge. aberto no navegador. Mantenha esta janela aberta. Ctrl+C para encerrar.'
try {
 while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $name = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($name)) { $name = 'index.html' }
  if ($name -notin @('index.html','Tabela_de_densidade.json','Valores_de_Referencia.json')) {
   $ctx.Response.StatusCode = 404; $ctx.Response.Close(); continue
  }
  $path = Join-Path $root $name
  if (-not (Test-Path -LiteralPath $path)) { $ctx.Response.StatusCode = 404; $ctx.Response.Close(); continue }
  $ctx.Response.ContentType = if ($name.EndsWith('.json')) { 'application/json; charset=utf-8' } else { 'text/html; charset=utf-8' }
  $ctx.Response.Headers.Add('Cache-Control','no-store')
  $bytes = [IO.File]::ReadAllBytes($path)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
  $ctx.Response.Close()
 }
} finally { $listener.Stop(); $listener.Close() }
