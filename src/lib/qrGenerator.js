import QRCode from "qrcode";

export async function generateQRForTable(tableNumber, baseUrl, slug) {
  // Now includes tenant isolation: /r/[slug]/menu
  const orderUrl = `${baseUrl}/r/${slug}/menu?table=${tableNumber}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });

    return qrDataUrl;
  } catch (error) {
    console.error("QR Generation Error:", error);
    throw new Error("Failed to generate QR code");
  }
}
