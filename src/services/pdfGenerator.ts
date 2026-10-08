import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DispatchOrder, EquipmentItem, DailyClosing } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../data/initialData';
import { StorageService } from './storage';

export const PdfService = {
  // 1. Generate Dispatch Delivery Receipt for Technician & Customer
  generateDispatchReceipt(order: DispatchOrder) {
    const doc = new jsPDF();
    const company = StorageService.getCompanyInfo();
    const isExit = order.type === 'salida';

    // Header bar
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 26, 'F');

    // Title & Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name.toUpperCase(), 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(`${company.nit}  |  ${company.phone}  |  ${company.city}`, 14, 19);

    // Document Title Banner
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(14, 32, 182, 14, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 32, 182, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const titleText = isExit
      ? `ACTA DE ENTREGA Y DESPACHO DE MATERIALES - N° ${order.orderNumber}`
      : `ACTA DE INGRESO / ENTRADA A BODEGA - N° ${order.orderNumber}`;
    doc.text(titleText, 18, 41);

    // Order Details Info Box
    let currentY = 52;
    doc.setFontSize(9);

    if (isExit) {
      // Box 1: Technician
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, currentY, 88, 32, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('INFORMACIÓN DEL TÉCNICO', 18, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Técnico: ${order.technicianName || 'No asignado'}`, 18, currentY + 13);
      doc.text(`Fecha Entrega: ${order.date}`, 18, currentY + 20);
      doc.text(`Despachado por: ${order.registeredBy}`, 18, currentY + 27);

      // Box 2: Customer / Destination
      doc.roundedRect(108, currentY, 88, 32, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('CLIENTE / DESTINO DE INSTALACIÓN', 112, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Cliente: ${order.customerName || 'N/A (Planta Externa / Stock Móvil)'}`, 112, currentY + 13);
      doc.text(`Dirección: ${order.customerAddress || 'Mantenimiento General'}`, 112, currentY + 20);
      doc.text(`Tipo de Trabajo: ${(order.workType || 'Instalación').toUpperCase()}`, 112, currentY + 27);

      currentY += 38;
    } else {
      // Entry Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, currentY, 182, 25, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('DATOS DE LA ENTRADA / COMPRA', 18, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Proveedor: ${order.supplier || 'Proveedor Directo'}`, 18, currentY + 13);
      doc.text(`Factura / Remisión: ${order.invoiceNumber || 'S/N'}`, 18, currentY + 19);
      doc.text(`Fecha Recepción: ${order.date}  |  Recibido por: ${order.registeredBy}`, 110, currentY + 13);

      currentY += 32;
    }

    // Items Table
    const tableRows = order.items.map((item, index) => {
      const serialsInfo =
        item.serialNumbers && item.serialNumbers.length > 0
          ? `\nS/N: ${item.serialNumbers.join(', ')}`
          : '';
      const categoryLabel = CATEGORIES_CONFIG[item.category]?.name || item.category;

      return [
        (index + 1).toString(),
        item.equipmentName + serialsInfo,
        categoryLabel,
        `${item.quantity} ${item.unit}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Descripción del Equipo / Material', 'Categoría', 'Cantidad']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 105 },
        2: { cellWidth: 45 },
        3: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    let finalY = doc.lastAutoTable.finalY + 8;

    // Notes if any
    if (order.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Observaciones / Notas de terreno:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(order.notes, 14, finalY + 5);
      finalY += 16;
    } else {
      finalY += 8;
    }

    // Signatures Section (Técnico, Almacén, Cliente)
    if (finalY > 230) {
      doc.addPage();
      finalY = 30;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Certifico que los materiales y equipos arriba detallados fueron recibidos a entera satisfacción en buen estado físico y funcional.',
      14,
      finalY
    );

    const signY = finalY + 22;
    // Signature 1: Técnico
    doc.setDrawColor(148, 163, 184);
    doc.line(18, signY, 70, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('FIRMA TÉCNICO RECEPTOR', 18, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(order.technicianName || 'Técnico Autorizado', 18, signY + 8);
    doc.text('C.C. _______________________', 18, signY + 12);

    // Signature 2: Bodega
    doc.line(80, signY, 132, signY);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGADO POR (ALMACÉN)', 80, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(order.registeredBy || 'Encargado de Inventario', 80, signY + 8);
    doc.text('Fecha: _____________________', 80, signY + 12);

    // Signature 3: Cliente (for installations)
    if (isExit && order.customerName) {
      doc.line(142, signY, 194, signY);
      doc.setFont('helvetica', 'bold');
      doc.text('RECIBIDO POR (CLIENTE)', 142, signY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(order.customerName.substring(0, 25), 142, signY + 8);
      doc.text('C.C. / DNI: ________________', 142, signY + 12);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generado automáticamente por NetStock ISP v1.0 | ${new Date().toLocaleString()} | Página 1`,
      14,
      285
    );

    // Save PDF
    doc.save(`Acta_${order.orderNumber}_${order.date.substring(0, 10)}.pdf`);
  },

  // 2. Generate Full Inventory Stock Report
  generateInventoryReport(equipment: EquipmentItem[]) {
    const doc = new jsPDF();
    const company = StorageService.getCompanyInfo();

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name.toUpperCase(), 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`INFORME GENERAL DE STOCK Y DISPONIBILIDAD DE EQUIPOS ISP`, 14, 18);

    // Metadata bar
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total de Referencias: ${equipment.length}`, 120, 30);

    const totalStockQty = equipment.reduce((acc, curr) => acc + curr.stock, 0);
    const criticalItems = equipment.filter((eq) => eq.stock <= eq.minStock);
    doc.text(`Unidades/Metros Totales: ${totalStockQty}`, 14, 35);
    doc.text(`Productos con Alerta de Stock Bajo: ${criticalItems.length}`, 120, 35);

    const tableRows = equipment.map((eq, index) => {
      const isCritical = eq.stock <= eq.minStock;
      const statusText = isCritical ? 'CRÍTICO' : 'NORMAL';
      const categoryName = CATEGORIES_CONFIG[eq.category]?.name || eq.category;

      return [
        (index + 1).toString(),
        eq.code,
        eq.name,
        categoryName,
        `${eq.stock} ${eq.unit}`,
        `${eq.minStock} ${eq.unit}`,
        statusText,
        eq.location || 'Bodega',
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Código', 'Nombre del Material / Equipo', 'Categoría', 'Stock', 'Mínimo', 'Estado', 'Ubicación']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'CRÍTICO') {
            data.cell.styles.textColor = [220, 38, 38]; // Red 600
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 58 },
        3: { cellWidth: 32 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Reporte de Inventario ISP - NetStock | Generado el ${new Date().toLocaleDateString()} | Página ${i} de ${pageCount}`,
        14,
        287
      );
    }

    doc.save(`Reporte_Inventario_ISP_${new Date().toISOString().substring(0, 10)}.pdf`);
  },

  // 3. Generate Movements Report (Entries & Exits)
  generateMovementsReport(orders: DispatchOrder[]) {
    const doc = new jsPDF();
    const company = StorageService.getCompanyInfo();

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name.toUpperCase(), 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`REPORTE DE MOVIMIENTOS: ENTRADAS Y SALIDAS DE EQUIPOS A TÉCNICOS`, 14, 18);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const totalEntries = orders.filter((o) => o.type === 'entrada').length;
    const totalExits = orders.filter((o) => o.type === 'salida').length;
    doc.text(`Fecha Reporte: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Entradas: ${totalEntries}  |  Total Despachos (Salidas): ${totalExits}`, 120, 30);

    const tableRows = orders.map((ord, idx) => {
      const typeLabel = ord.type === 'salida' ? 'SALIDA (Técnico)' : 'ENTRADA (Bodega)';
      const recipient = ord.type === 'salida' ? ord.technicianName || 'N/A' : ord.supplier || 'Bodega';
      const destination = ord.type === 'salida' ? ord.customerName || 'Planta Externa' : ord.invoiceNumber || 'Compra';
      const itemsSummary = ord.items.map((i) => `${i.quantity}x ${i.equipmentName.substring(0, 20)}`).join(', ');

      return [
        (idx + 1).toString(),
        ord.orderNumber,
        ord.date.substring(0, 16),
        typeLabel,
        recipient,
        destination,
        itemsSummary,
        ord.status.toUpperCase(),
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Folio', 'Fecha', 'Tipo', 'Técnico / Origen', 'Cliente / Factura', 'Materiales Despachados', 'Estado']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 26 },
        5: { cellWidth: 26 },
        6: { cellWidth: 46 },
        7: { cellWidth: 16, halign: 'center' },
      },
      margin: { left: 10, right: 10 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Reporte de Movimientos ISP | Generado el ${new Date().toLocaleDateString()} | Página ${i} de ${pageCount}`,
        14,
        287
      );
    }

    doc.save(`Reporte_Movimientos_${new Date().toISOString().substring(0, 10)}.pdf`);
  },

  // 4. Generate Daily Warehouse Closing Report (Cierre Diario de Bodega)
  generateDailyClosingReport(closing: DailyClosing) {
    const doc = new jsPDF();
    const company = StorageService.getCompanyInfo();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 26, 'F');

    // Title & Company Name (uses dynamic configured name!)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name.toUpperCase(), 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`${company.nit}  |  ${company.phone}  |  ${company.city}`, 14, 19);

    // Document Title Banner
    doc.setFillColor(243, 232, 255); // Purple 100
    doc.rect(14, 32, 182, 14, 'F');
    doc.setDrawColor(216, 180, 254);
    doc.rect(14, 32, 182, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(88, 28, 135); // Purple 900
    doc.text(`ACTA DE CIERRE DIARIO DE BODEGA & MOVIMIENTOS FTTH - N° ${closing.closingNumber}`, 18, 41);

    // Metadata Info Box
    let currentY = 52;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 30, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DATOS DE LA JORNADA & RESPONSABLES DE BODEGA', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha de Corte: ${closing.date}`, 18, currentY + 13);
    doc.text(`Hora de Cierre: ${closing.closedAt}`, 18, currentY + 19);
    doc.text(`Cerrado por: ${closing.closedBy}`, 18, currentY + 25);

    doc.text(`Supervisor / Coordinador: ${closing.supervisorName || 'Jefe de Operaciones'}`, 105, currentY + 13);
    doc.text(`Salidas a Técnicos: ${closing.totalExitsCount} órdenes (${closing.totalExitsUnits} unidades)`, 105, currentY + 19);
    doc.text(`Entradas de Almacén: ${closing.totalEntriesCount} compras (${closing.totalEntriesUnits} unidades)`, 105, currentY + 25);

    currentY += 36;

    // Table of Today's Orders
    const tableRows = closing.orders.map((ord, idx) => {
      const typeLabel = ord.type === 'salida' ? 'SALIDA (Técnico)' : 'ENTRADA (Bodega)';
      const recipient = ord.type === 'salida' ? ord.technicianName || 'N/A' : ord.supplier || 'Bodega';
      const destination = ord.type === 'salida' ? ord.customerName || 'Terreno' : ord.invoiceNumber || 'Factura';
      const itemsSummary = ord.items
        .map((i) => {
          const serials = i.serialNumbers?.length ? ` [S/N: ${i.serialNumbers.join(', ')}]` : '';
          return `${i.quantity}x ${i.equipmentName}${serials}`;
        })
        .join('\n');

      return [
        (idx + 1).toString(),
        ord.orderNumber,
        ord.date.substring(11, 16) || ord.date,
        typeLabel,
        recipient,
        destination,
        itemsSummary,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Folio', 'Hora', 'Tipo', 'Técnico / Proveedor', 'Cliente / Destino', 'Materiales Entregados / Seriales']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [88, 28, 135], // Purple 900
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 24 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
        6: { cellWidth: 52 },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    let finalY = doc.lastAutoTable.finalY + 8;

    // Notes if any
    if (closing.notes) {
      if (finalY > 230) {
        doc.addPage();
        finalY = 25;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Novedades u Observaciones del Cierre:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(closing.notes, 14, finalY + 5);
      finalY += 16;
    } else {
      finalY += 8;
    }

    // Signatures Section
    if (finalY > 230) {
      doc.addPage();
      finalY = 30;
    }

    const signY = finalY + 22;
    doc.setDrawColor(148, 163, 184);

    // Signature 1: Bodeguero
    doc.line(20, signY, 90, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('ENTREGADO POR (ALMACÉN / BODEGA)', 20, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(closing.closedBy || 'Encargado de Turno', 20, signY + 8);
    doc.text('C.C. / RUT: _________________________', 20, signY + 12);

    // Signature 2: Supervisor
    doc.line(120, signY, 190, signY);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFICADO POR (SUPERVISOR DE OPERACIONES)', 120, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(closing.supervisorName || 'Coordinador de Terreno', 120, signY + 8);
    doc.text('Fecha / Hora: _______________________', 120, signY + 12);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Cierre Diario de Bodega ISP | ${company.name} | ${closing.closingNumber} | Página ${i} de ${pageCount}`,
        14,
        287
      );
    }

    doc.save(`Cierre_Diario_Bodega_${closing.date}.pdf`);
  },
};
