"""Regenera el modelo de contrato con estética grafito y controles marfil."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'contrato-chessdev.pdf'
C = canvas.Canvas(str(OUT), pagesize=(595.28, 841.89))
C.setTitle('ChessDev - Modelo de contrato y reposición de material')
C.setAuthor('TopChess')
BG, PANEL, INK, MUTED, EDGE, LIGHT = map(HexColor, ['#141419', '#202026', '#f3f3ed', '#bcbcc7', '#08080d', '#edede7'])

def txt(x, y, text, size=10, bold=False, color=INK, mono=False):
    C.setFillColor(color)
    C.setFont('Courier' if mono else ('Helvetica-Bold' if bold else 'Helvetica'), size)
    C.drawString(x, y, text)

def paragraph(text, y, width=467, size=8.6, leading=13, color=MUTED):
    for line in simpleSplit(text, 'Helvetica', size, width):
        txt(64, y, line, size, color=color)
        y -= leading
    return y

def panel(y, height, label):
    C.setFillColor(EDGE)
    C.roundRect(41, y-6, 513, height, 18, fill=1, stroke=0)
    C.setFillColor(PANEL)
    C.setStrokeColor(HexColor('#414149'))
    C.setLineWidth(1)
    C.roundRect(41, y, 513, height, 18, fill=1, stroke=1)
    txt(57, y+height-25, label, 9, True)

def field(label, x, y, width, height=23):
    txt(x, y+height+6, label, 7.5, color=MUTED)
    C.setFillColor(EDGE)
    C.roundRect(x, y-3, width, height, 6, fill=1, stroke=0)
    C.setFillColor(LIGHT)
    C.setStrokeColor(EDGE)
    C.roundRect(x, y, width, height, 6, fill=1, stroke=1)

def frame(page):
    C.setFillColor(BG)
    C.rect(0, 0, 595.28, 841.89, fill=1, stroke=0)
    C.setFillColor(EDGE)
    C.roundRect(41, 777, 42, 42, 11, fill=1, stroke=0)
    C.setFillColor(LIGHT)
    C.roundRect(41, 782, 42, 42, 11, fill=1, stroke=0)
    txt(49, 795, 'CD', 16, True, color=EDGE)
    txt(98, 797, 'CHESSDEV / TOPCHESS', 12, mono=True)
    txt(42, 756, 'MODELO POR COMPLETAR Y REVISAR ANTES DE CONTRATAR', 8, mono=True, color=MUTED)
    C.setStrokeColor(HexColor('#3c3c46'))
    C.line(41, 49, 554, 49)
    txt(41, 31, 'TopChess / 613 133 823 / Solo mensajes. No llamadas.', 7, color=MUTED)
    txt(526, 31, f'{page} / 2', 7, color=MUTED)

frame(1)
txt(41, 720, 'Material listo. Reglas claras.', 25, True)
txt(42, 696, 'CONTRATO DE ALQUILER DE MATERIAL DE AJEDREZ', 9, mono=True, color=MUTED)
panel(392, 278, '01 / IDENTIFICACIÓN DE LAS PARTES')
field('Prestador / representante', 57, 601, 481)
txt(65, 609, 'Andrés Liñán, fundador de TopChess', 9, True, color=EDGE)
field('NIF del prestador', 57, 554, 132)
field('Domicilio fiscal del prestador', 201, 554, 337)
field('Nombre y apellidos del cliente (obligatorio)', 57, 507, 273)
field('NIF / documento del cliente', 342, 507, 196)
field('Club o entidad (obligatorio)', 57, 460, 481)
field('Contacto para mensajes', 57, 413, 222)
field('Representante, si corresponde', 291, 413, 247)

panel(231, 143, '02 / RESERVA, RECOGIDA Y DEVOLUCIÓN')
field('Referencia de reserva', 57, 307, 222)
field('Lugar y fecha de firma', 291, 307, 247)
field('Recogida: fecha y hora', 57, 259, 222)
field('Devolución: fecha y hora', 291, 259, 247)

panel(73, 140, '03 / PRECIO Y ENTREGA')
field('Recogida y devolución en TopChess', 57, 145, 481)
txt(65, 153, 'Eugenio Salazar 54, 28002 Madrid', 9, color=EDGE)
txt(57, 126, 'Gestión: 50 EUR + material. Alquiler: máximo 48 h. Antelación: mínimo 10 h.', 8)
field('Total definitivo, impuestos incluidos (EUR)', 57, 88, 222)
field('Pago: medio y justificante', 291, 88, 247)
C.showPage()

frame(2)
txt(41, 720, 'Lo recoges. Lo cuidas. Vuelve.', 24, True)
panel(443, 247, '04 / INVENTARIO Y REPOSICIÓN A NUEVO')
txt(57, 643, 'Completar y acordar todos los valores antes de firmar. Importes en EUR.', 8, color=MUTED)
# Los campos claros facilitan completar el contrato a mano pese al diseño oscuro.
C.setFillColor(LIGHT)
C.roundRect(57, 461, 481, 167, 8, fill=1, stroke=0)
columns = [57, 192, 221, 355, 421, 538]
for x, label in zip(columns, ['Producto', 'Ud.', 'Estado / referencia', 'Alquiler', 'Nuevo / ud.']):
    txt(x+6, 614, label, 7, True, color=EDGE)
names = ['Tablero normal', 'Juego de piezas', 'Reloj DGT Easy', 'Reloj Leap', 'Set plegable', 'Tablero mural', 'Ajedrez gigante']
C.setStrokeColor(HexColor('#b1b1b5'))
C.setLineWidth(.5)
for i, name in enumerate(names):
    y = 594-i*19
    txt(63, y, name, 7.3, color=EDGE)
    C.line(57, y-6, 538, y-6)
for x in columns[1:-1]: C.line(x, 461, x, 628)

panel(212, 212, '05 / PLAZOS, RESPONSABILIDAD Y REPOSICIÓN')
y = 378
for text in [
    'La solicitud debe recibirse al menos 10 horas antes de la recogida. No se aceptan solicitudes con menos margen. El alquiler dura como máximo 48 horas reales, desde la recogida hasta la devolución. Los horarios son de Madrid y requieren confirmación de TopChess. El cliente devuelve todas las unidades en el estado registrado; se revisa el inventario con ambas partes.',
    'En caso de pérdida, falta de devolución tras requerimiento o daño irreparable imputable al cliente, este abonará el coste íntegro de reposición de la unidad afectada por un producto nuevo del mismo modelo o de características equivalentes. El valor por unidad se documentará y acordará en el inventario antes de contratar.',
    'Los daños reparables imputables al cliente se liquidarán por el coste de reparación documentado. Se excluyen el desgaste normal y los deterioros ajenos a su responsabilidad. Toda reclamación deberá justificarse y respetar los derechos imperativos del cliente.',
]:
    y = paragraph(text, y)
    y -= 7

panel(67, 127, '06 / ACEPTACIÓN Y CONDICIONES PENDIENTES')
paragraph('Antes de utilizar este modelo deben completarse los datos fiscales, los precios de reposición y las condiciones de cancelación, desistimiento y protección de datos. No se presume que los 50 EUR sean siempre no reembolsables. Adjuntar registro de devolución e incidencias.', 149, size=7.3, leading=11)
field('Firma del prestador', 57, 87, 222, 22)
txt(57, 74, 'Andrés Liñán / Fundador de TopChess', 7.3, True)
field('Firma del cliente / representante', 291, 87, 247, 22)
C.showPage()
C.save()
print(f'PDF actualizado: {OUT}')
