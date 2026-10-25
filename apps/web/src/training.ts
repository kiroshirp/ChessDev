export function downloadPgn(pgn: string) {
  const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'chessdev-estudio.pgn';
  anchor.click();
  URL.revokeObjectURL(url);
}
