import { CONTACT, euros } from './rental.mjs';
import { COMMERCIAL, displayDate, requestTotal } from './orders.mjs';

export async function createOrderPDF(order,kind='contract',provider={},library=globalThis.PDFLib) {
  if(order.provider?.legalName||order.provider?.taxId)provider=order.provider;
  const terms=order.terms||COMMERCIAL;
  if(!library)throw Error('No se ha podido cargar el generador PDF. Recarga el panel.');
  const {PDFDocument,StandardFonts,rgb}=library;
  const doc=await PDFDocument.create();
  const normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const color=hex=>rgb(...hex.match(/\w\w/g).map(n=>parseInt(n,16)/255));
  const ink=color('efefe9'),muted=color('c2c2cb'),paper=color('eeeeea'),dark=color('15151b'),panel=color('25252d');
  let page,y,pageNumber=0;
  const titles={contract:'Contrato de alquiler',handover:'Acta de entrega de material',return:'Acta de devolución de material'};
  const title=titles[kind];if(!title)throw Error('Documento no válido.');
  doc.setTitle(`${title} - ${order.reference}`);doc.setAuthor('TopChess');doc.setLanguage('es-ES');
  function line(text='',size=9,strong=false,c=ink,x=48) {
    try { page.drawText(String(text),{x,y,size,font:strong?bold:normal,color:c}); }
    catch {throw Error('El documento contiene un carácter que no se puede imprimir. Revisa los datos antes de generar el PDF.');}
    y-=size+7;
  }
  function newPage() {
    page=doc.addPage([595.28,841.89]);pageNumber++;
    page.drawRectangle({x:0,y:0,width:595.28,height:841.89,color:dark});
    page.drawRectangle({x:40,y:772,width:515,height:36,color:panel});
    y=785;line('CHESSDEV / HECHO POR TOPCHESS',12,true,ink,52);
    y=745;line(title,23,true);line(`Referencia: ${order.reference} / ${displayDate(order.createdAt)}`,8,false,muted);
    page.drawText(`${pageNumber} / ${order.reference}`,{x:400,y:28,size:7,font:normal,color:muted});
    page.drawText('TopChess / 613 133 823 / Solo mensajes. No llamadas.',{x:42,y:28,size:7,font:normal,color:muted});
  }
  function ensure(height=45){if(y-height<64)newPage();}
  function paragraph(text,size=9) {
    const words=String(text).split(/\s+/);let current='';
    for(const word of words) {
      let width;try{width=normal.widthOfTextAtSize(current?`${current} ${word}`:word,size);}catch{throw Error('Hay caracteres no compatibles con el PDF. Revisa los datos del pedido.');}
      if(width>495&&current){ensure(25);line(current,size,false,muted);current='';}
      // Evitar desbordes por identificadores o texto sin espacios.
      if(normal.widthOfTextAtSize(word,size)>495){for(const char of word){if(normal.widthOfTextAtSize(current+char,size)>495){ensure(25);line(current,size,false,muted);current='';}current+=char;}}
      else current=current?`${current} ${word}`:word;
    }
    if(current){ensure(25);line(current,size,false,muted);}y-=4;
  }
  function heading(text){ensure(55);y-=8;line(text,11,true);y-=3;}
  function blank(label,height=32) {
    ensure(height+42);line(label,8,false,muted);
    page.drawRectangle({x:48,y:y-height+5,width:495,height,color:paper,borderColor:rgb(0,0,0),borderWidth:1});y-=height+12;
  }
  function signatures() {
    ensure(160);
    page.drawText('Firma del prestador',{x:48,y,size:8,font:normal,color:muted});
    page.drawText('Firma del cliente o representante',{x:308,y,size:8,font:normal,color:muted});
    y-=60;
    for(const x of [48,308])page.drawRectangle({x,y:y+7,width:235,height:45,color:paper,borderColor:rgb(0,0,0),borderWidth:1});
    page.drawText('Andrés Liñán / Fundador de TopChess',{x:48,y:y-8,size:7,font:bold,color:ink});
    y-=28;line('Firma presencial en TopChess. No contiene firmas electrónicas.',7,false,muted);
    blank('Lugar, fecha y hora de firma',24);
  }
  newPage();
  if(order.status==='draft'||!provider.legalName||!provider.taxId)paragraph('DOCUMENTO POR COMPLETAR: revisar datos fiscales y condiciones antes de firmar.',8);
  heading('01 / Partes y horarios');
  paragraph(`Prestador: ${provider.legalName||'____________________________'} / NIF: ${provider.taxId||'________________'}. Representante: Andrés Liñán, fundador de TopChess.`);
  paragraph(`Cliente: ${order.customer}. Entidad organizadora: ${order.organization}. Documento: ${order.customerDocument||'________________'}. Contacto para mensajes: ${order.contact}.`);
  paragraph(`Recogida prevista: ${displayDate(order.pickupAt)}. Devolución prevista: ${displayDate(order.returnAt)}. Máximo 48 horas reales.`);
  paragraph(`Solicitud registrada: ${displayDate(order.createdAt)}. Antelación mínima: 10 horas. Lugar: TopChess, ${CONTACT.address}.`);
  heading('02 / Inventario del pedido');
  for(const [id,item] of Object.entries(order.items)) {
    ensure(kind==='contract'?70:135);
    page.drawLine({start:{x:48,y:y+5},end:{x:543,y:y+5},thickness:1,color:panel});
    y-=8;
    paragraph(`${item.quantity} x ${item.name} / alquiler ${euros(item.unitPrice)}/ud. / reposición a nuevo ${euros(item.replacementValue)}/ud.`,9);
    if(kind==='handover')blank('Unidades entregadas, estado, referencias y observaciones',30);
    if(kind==='return') {
      const r=order.returnRecord?.items?.[id];
      if(r)paragraph(`Registrado: ${r.returned} devueltas, ${r.damaged} dañadas. No devueltas: ${item.quantity-r.returned}. ${r.note||''}`,8);
      blank('Unidades devueltas / faltantes / dañadas, estado y observaciones',30);
    }
    y-=8;
  }
  if(kind==='contract') {
    heading('03 / Precio y condiciones');
    line(`Gestión: ${euros(order.managementFee)} + material: ${euros(requestTotal(order)-order.managementFee)}`,10,true);
    line(`TOTAL: ${euros(requestTotal(order))} / IVA incluido`,15,true);
    paragraph(terms.payment);if(provider.paymentInstructions)paragraph(provider.paymentInstructions);
    paragraph(terms.cancellation);paragraph(terms.delay);
    paragraph('El material se comprueba al entregar y devolver. La pérdida, falta de devolución tras requerimiento o daño irreparable imputable al cliente puede dar lugar a la reclamación del coste de reposición a nuevo equivalente documentado y acordado para la unidad afectada, respetando la normativa aplicable. Los daños reparables se valoran por su reparación documentada. Se excluyen desgaste normal y daños ajenos a su responsabilidad.');
    paragraph('La entrega requiere contrato y acta de entrega firmados presencialmente, y transferencia recibida. El acta de devolución recoge la fecha real, las unidades y las incidencias. Cada parte conserva una copia. La firma no supone renuncia a los derechos que correspondan al cliente.');
    paragraph(`Condiciones aceptadas: ${order.termsVersion}. Referencia de transferencia: ${order.payment?.reference||'________________'}.`);
    paragraph('Documento preparado con los datos de este pedido para revisión, comprobación y firma presencial de ambas partes. No constituye una factura.');
  } else if(kind==='handover') {
    heading('03 / Confirmación de entrega');
    paragraph(`El cliente recibe el inventario indicado y ambas partes revisan cantidades y estado. Pago por transferencia: ${order.payment?.status==='received'?'registrado como recibido':'pendiente de comprobar'} / referencia ${order.payment?.reference||'________________'}.`);
    if(order.handover?.at)paragraph(`Entrega registrada: ${displayDate(order.handover.at)}. ${order.handover.note||''}`);
    blank('Fecha y hora real de entrega / Observaciones de ambas partes',42);
  } else {
    heading('03 / Confirmación de devolución e incidencias');
    if(order.returnRecord?.at) {
      const delay=Math.max(0,(order.returnRecord.at-order.returnAt)/3600000);
      paragraph(`Devolución registrada: ${displayDate(order.returnRecord.at)}. Retraso registrado: ${Number(delay.toFixed(2))} h. No se aplica recargo automático. ${order.returnRecord.note||''}`);
    }
    paragraph('Se deja constancia del material efectivamente devuelto y su estado. La recepción no extingue por sí sola una reclamación documentada por unidades faltantes o daños. Si no se devuelve material, se conserva el acta de entrega y se documentan los requerimientos e incidencias; no se inventa una firma de devolución.');
    blank('Fecha y hora real de devolución / Incidencias y desacuerdos',50);
    if(order.incident?.note)paragraph(`Incidencia registrada: ${order.incident.note}`);
  }
  if(order.notes)paragraph(`Observaciones de la solicitud: ${order.notes}`);
  signatures();
  return doc.save();
}

export async function downloadOrderPDF(order,kind,provider) {
  const bytes=await createOrderPDF(order,kind,provider);
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download=`${order.reference}-${kind}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
