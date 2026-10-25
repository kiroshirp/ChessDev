"""Regenera el modelo imprimible; requiere reportlab. No es un contrato aprobado."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'contrato-chessdev.pdf'
C = canvas.Canvas(str(OUT), pagesize=(595.28, 841.89))
C.setTitle('ChessDev - Modelo de contrato de alquiler de material')
C.setAuthor('TopChess')
INK = HexColor('#1b2922')
MUTED = HexColor('#62695f')
LINE = HexColor('#d5d7cb')
ORANGE = HexColor('#ec623d')

def txt(x, y, text, size=10, bold=False, color=INK):
    C.setFillColor(color)
    C.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    C.drawString(x, y, text)

def paragraph(text, y, width=495, size=9, leading=14):
    for line in simpleSplit(text, 'Helvetica', size, width):
        txt(50, y, line, size)
        y -= leading
    return y

def line(y, left=50, right=545):
    C.setStrokeColor(LINE)
    C.setLineWidth(.6)
    C.line(left, y, right, y)

def heading(label, y):
    txt(50, y, label, 11, True)
    line(y-10)

def frame(page):
    txt(50, 790, 'ChessDev.', 27, True)
    txt(401, 792, 'HECHO POR TOPCHESS', 8, True)
    C.setFillColor(ORANGE)
    C.rect(50, 752, 495, 22, fill=1, stroke=0)
    txt(61, 760, 'MODELO POR COMPLETAR Y REVISAR ANTES DE CONTRATAR', 8, True)
    line(53)
    txt(50, 37, 'TopChess - 613 133 823 - Solo mensajes. No atendemos llamadas.', 8, color=MUTED)
    txt(505, 37, f'{page} / 2', 8, color=MUTED)

frame(1)
txt(50, 719, 'Alquiler de material de ajedrez', 20, True)
txt(50, 698, 'Referencia: ____________________     Lugar y fecha: __________________________', 9)
heading('01 / Identificación de las partes', 665)
for y, text in [
    (638, 'Prestador (nombre o razón social): __________________________________________'),
    (615, 'NIF: __________________  Domicilio fiscal: __________________________________'),
    (592, 'Cliente / entidad: ________________________________________________________'),
    (569, 'NIF / documento: ______________  Representante: _____________________________'),
    (546, 'Contacto para mensajes: __________________________________________________')]: txt(50, y, text, 9)
heading('02 / Recogida y devolución', 511)
txt(50, 484, 'Recogida (fecha y hora): ______________  Devolución (fecha y hora): ______________', 9)
txt(50, 461, 'Dirección acordada: ______________________________________________________', 9)
txt(50, 440, 'Transporte a cargo del cliente. No hay envío ni horario confirmado sin acuerdo previo.', 8, color=MUTED)
heading('03 / Inventario entregado y valor de reposición', 408)
widths = [50, 220, 270, 400, 470, 545]
C.setFillColor(HexColor('#e7eadf'))
C.rect(50, 371, 495, 22, fill=1, stroke=0)
for x, label in zip(widths, ['Material', 'Ud.', 'Estado / referencia', 'Alquiler', 'Reposición']): txt(x+7, 379, label, 8, True)
names = ['Tablero normal', 'Juego de piezas', 'Reloj DGT Easy', 'Reloj Leap', 'Set plegable', 'Tablero mural', 'Ajedrez gigante']
for i, name in enumerate(names):
    y = 353 - i*23
    txt(57, y, name, 8)
    line(y-8)
for x in widths: 
    C.setStrokeColor(LINE)
    C.line(x, 393, x, 207)
heading('04 / Importe y fianza (completar antes de aceptar)', 177)
txt(50, 150, 'Gestión urgente: 50 EUR     Material: __________ EUR     Impuestos: __________ EUR', 9)
txt(50, 127, 'Total definitivo (impuestos incluidos): __________ EUR     Fianza: __________ EUR', 9)
txt(50, 104, 'Forma y justificante de pago: ______________________________________________', 9)
txt(50, 82, 'Más de 48 horas: presupuesto específico adjunto. La fianza se registra separadamente.', 8, color=MUTED)
C.showPage()

frame(2)
txt(50, 718, 'Condiciones y comprobaciones', 20, True)
y = 687
for title, body in [
    ('05 / Confirmación y entrega', 'La solicitud no confirma disponibilidad ni reserva. Antes de contratar se concretan material, precio total, fianza, dirección, horarios y condiciones. Ambas partes comprueban el inventario y su estado en la recogida y la devolución.'),
    ('06 / Cuidado, daños y devolución de la fianza', 'El material se devuelve en el estado registrado, salvo desgaste normal o deterioros ajenos a la responsabilidad del cliente. Las pérdidas o daños imputables se valoran y documentan. La fianza no se pierde automáticamente en su totalidad; cualquier deducción debe justificarse.'),
    ('07 / Cancelación y derechos aplicables', 'PENDIENTE DE DEFINIR Y REVISAR: incorporar antes de contratar las condiciones de cancelación, la información sobre desistimiento que corresponda y, cuando proceda, los consentimientos para comenzar el servicio. No se presume que la gestión urgente sea siempre no reembolsable.'),
]:
    heading(title, y)
    y = paragraph(body, y-27)
    y -= 22
txt(50, y, 'Condiciones particulares / anexo aceptado: __________________________________', 9)
line(y-28)
line(y-52)
y -= 87
heading('08 / Revisión, devolución y liquidación', y)
y -= 28
txt(50, y, 'Fecha y hora de devolución efectiva: ________________________________________', 9)
txt(50, y-25, 'Estado / incidencias documentadas: _________________________________________', 9)
txt(50, y-50, 'Fianza devuelta: __________ EUR     Deducción justificada: __________ EUR', 9)
txt(50, y-75, 'Fecha y medio de devolución de fianza: ______________________________________', 9)
y -= 117
txt(50, y, 'Firma del prestador', 9, True)
txt(320, y, 'Firma del cliente / representante', 9, True)
line(y-48, 50, 255)
line(y-48, 320, 545)
y -= 76
paragraph('Este documento es un modelo de trabajo, no un contrato definitivo aprobado. Completar los datos del prestador, revisar las condiciones y facilitar la información precontractual y de protección de datos aplicable antes de su utilización.', y, size=7.5, leading=11)
txt(50, 91, 'Referencias para revisión: Código Civil, arts. 1561 y 1563; RDL 1/2007, arts. 97 y 102-108.', 7, color=MUTED)
C.linkURL('https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763', (50, 78, 270, 88), relative=0)
txt(50, 80, 'BOE: Código Civil', 7, color=MUTED)
C.linkURL('https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555', (285, 78, 545, 88), relative=0)
txt(285, 80, 'BOE: defensa de consumidores y usuarios', 7, color=MUTED)
C.save()
print(f'PDF creado: {OUT}')
