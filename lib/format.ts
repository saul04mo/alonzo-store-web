export function formatUSD(amount: number): string {
  return `$ ${amount.toFixed(2)}`;
}

export function formatBs(amount: number): string {
  return `Bs. ${amount.toFixed(2)}`;
}

export function formatDate(date: any): string {
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return 'Fecha desconocida';
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppMessage(
  numericId: number,
  invoice: {
    deliveryType: string;
    deliveryZone?: string;
    deliveryCostUsd?: number;
    total: number;
    clientSnapshot: { name: string; phone?: string; rif_ci?: string; address?: string };
    items: Array<{ quantity: number; name: string; size?: string; color?: string }>;
    payments?: Array<{ method: string; amountVes: number; ref?: string; proofUrl?: string }>;
  }
): string {
  let deliveryText = 'Retiro en Tienda';
  if (invoice.deliveryType === 'delivery')
    deliveryText = `Delivery (${invoice.deliveryZone || 'Zona no esp.'})`;
  else if (invoice.deliveryType === 'nacional') deliveryText = 'Envío Nacional';

  const deliveryCost = invoice.deliveryCostUsd || 0;
  const subtotal = invoice.total - deliveryCost;

  let msg = `*PEDIDO #${numericId}*\n`;
  msg += `Tipo de Envío: ${deliveryText}\n`;
  msg += `Dirección: ${invoice.clientSnapshot.address || 'N/A'}\n\n`;
  msg += `*DATOS DEL CLIENTE*\n`;
  msg += `Nombre: ${invoice.clientSnapshot.name}\n`;
  msg += `Teléfono: ${invoice.clientSnapshot.phone || 'N/A'}\n`;
  msg += `Cédula: ${invoice.clientSnapshot.rif_ci || 'N/A'}\n\n`;
  msg += `*DETALLE DEL PEDIDO*\n`;

  invoice.items.forEach((item) => {
    const variant = item.size ? `(${item.size}${item.color ? '/' + item.color : ''})` : '';
    msg += `${item.quantity}x ${item.name} ${variant}\n`;
  });

  msg += `----------------\n`;
  msg += `Sub Total: $ ${subtotal.toFixed(2)}\n`;
  msg += `Costo del Delivery: $ ${deliveryCost.toFixed(2)}\n`;
  msg += `*TOTAL A PAGAR: $ ${invoice.total.toFixed(2)}*\n\n`;
  msg += `*FORMA DE PAGO*\n`;

  if (invoice.payments && invoice.payments.length > 0) {
    invoice.payments.forEach((p) => {
      msg += `Método: ${p.method}\n`;
      msg += `Monto Bs: Bs. ${p.amountVes.toFixed(2)}\n`;
      if (p.ref) msg += `REF: ${p.ref}\n`;
      if (p.proofUrl) msg += `Comprobante: ${p.proofUrl}\n`;
      msg += '\n';
    });
  } else {
    msg += 'Pago pendiente o a convenir\n';
  }

  return msg;
}
