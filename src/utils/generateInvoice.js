
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order) => {
    const doc = new jsPDF();
    const logoUrl = '/logo.jpg';

    // Helper to add text centered
    const centerText = (text, y, fontSize = 12, font = "helvetica", style = "normal") => {
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (doc.internal.pageSize.width - textWidth) / 2;
        doc.text(text, x, y);
    };

    // --- Header ---
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => {
        // Logo
        const logoWidth = 40;
        const logoHeight = 40;
        const logoX = (doc.internal.pageSize.width - logoWidth) / 2;
        doc.addImage(img, 'JPEG', logoX, 10, logoWidth, logoHeight);

        // Store Name
        centerText("Lahfa'h", 55, 22, "helvetica", "bold");

        // Slogan
        // Note: jsPDF has limited emoji support. We'll try to use standard text or replace with text if it fails rendering.
        // For specific emoji support in jsPDF, custom fonts are often needed.
        // We will try to render the text as is.
        centerText("Your sensual journey begins with Lahfa’h", 65, 12, "helvetica", "italic");

        // --- Invoice Details ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 80);
        doc.text(`Order #: ${order.orderNumber || order.id?.slice(0, 8)}`, 15, 85);

        doc.text(`Customer: ${order.customer}`, 140, 80);
        doc.text(`City: ${order.city || '-'}`, 140, 85);
        doc.text(`Phone: ${order.phone || '-'}`, 140, 90);

        // --- Items Table ---
        const totalAmount = parseFloat(order.amount || 0);
        const deliveryFee = parseFloat(order.deliveryFee || 0);
        const productTotal = Math.max(0, totalAmount - deliveryFee);

        const items = order.items || [{
            article: order.article,
            quantity: order.quantity || 1,
            price: productTotal // Assign derived product total to the single item if simplified
        }];

        // If multiple items, we might not know per-item price exactly if it was just a total amount entered.
        // But assuming 'price' in items is accurate if coming from product selection.
        // If not, we might need to fallback. 
        // For now, let's just list items. If we rely on the calculated productTotal, we might distribute it or show as is.

        const tableBody = items.map(item => [
            item.article || 'Product',
            item.quantity || 1,
            `${parseFloat(item.price || (productTotal / (item.quantity || 1))).toFixed(2)} DH`
        ]);

        // Add Delivery Row
        if (deliveryFee > 0) {
            tableBody.push(['Livraison', '1', `${deliveryFee.toFixed(2)} DH`]);
        }

        autoTable(doc, {
            startY: 100,
            head: [['Product', 'Quantity', 'Price']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [255, 105, 180] }, // Pinkish header for Lahfa
            styles: { fontSize: 10 },
        });

        // --- Totals ---
        let finalY = doc.lastAutoTable.finalY + 10;

        const rightAlignX = 140;

        doc.setFontSize(11);
        doc.text(`Total Global: ${totalAmount.toFixed(2)} DH`, rightAlignX, finalY);

        // --- Disclaimer & Footer ---
        finalY += 20;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);

        const disclaimer = "Chez lahfa pour des raisons d'hygiène nos articles ne peuvent pas être essayés ni repris une fois la commande ouverte merci de votre compréhension";

        const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
        doc.text(splitDisclaimer, 15, finalY);

        // Save
        doc.save(`Invoice_${order.orderNumber || order.id}.pdf`);
    };

    img.onerror = () => {
        console.error("Could not load logo. Saving PDF without logo.");
        // Fallback save ignoring logo area
        centerText("Lahfa'h", 20, 22, "helvetica", "bold");
        doc.save(`Invoice_${order.orderNumber || order.id}.pdf`);
    };
};
