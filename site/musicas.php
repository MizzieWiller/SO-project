<?php
// Lista os arquivos de áudio da pasta "musicas" (ao lado deste arquivo).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir = __DIR__ . '/musicas';
$saida = [];

if (is_dir($dir)) {
  $arquivos = scandir($dir);
  sort($arquivos, SORT_STRING | SORT_FLAG_CASE);
  foreach ($arquivos as $f) {
    if (preg_match('/\.(mp3|ogg|wav|m4a|webm)$/i', $f)) {
      $saida[] = [
        'name' => preg_replace('/\.[^.]+$/', '', $f),
        'url'  => 'musicas/' . rawurlencode($f),
      ];
    }
  }
}

echo json_encode($saida, JSON_UNESCAPED_UNICODE);
