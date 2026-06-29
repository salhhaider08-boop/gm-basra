import fs from "fs";
import { parse } from "csv-parse/sync";

function parseNumber(str) {
  if (!str) return 0;
  let numStr = str.toString().replace(/[^\d٫.,\-]/g, '');
  numStr = numStr.replace(/[٬,]/g, '');
  numStr = numStr.replace(/٫/g, '.');
  return Number(numStr) || 0;
}

function run() {
  const purchasesContent = fs.readFileSync('C:\\Users\\asus\\Downloads\\GM ACCOUNTING - المشتريات.csv', 'utf-8');
  const purchasesRecords = parse(purchasesContent, { skip_empty_lines: true });
  const purchasesDataRows = purchasesRecords.slice(3);
  
  const purchasesArray = [];
  let pId = 1600000000000;
  for (let i = 0; i < purchasesDataRows.length; i++) {
    const row = purchasesDataRows[i];
    if (row.length < 12 || !row[1]) continue;

    const dateStr = row[1];
    if (!dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) continue;
    const formattedDate = dateStr.replace(/\//g, '-');

    const receiptNo = row[2] || (i + 1).toString();
    const details = row[3] || "مادة مشتراة";
    const amountUSD = parseNumber(row[4]);
    const paidUSD = parseNumber(row[9]);

    // Parse status from row 14 (واصل or anything else)
    const statusRaw = (row[14] || '').trim();
    const status = statusRaw.includes('واصل') ? 'واصل' : 'قيد الشحن';

    const shippingCost = parseNumber(row[16]);
    const exchange = parseNumber(row[17]) || 1390;

    purchasesArray.push({
      id: pId++,
      date: formattedDate,
      code: receiptNo,
      details: details,
      amountUSD: amountUSD,
      commissionRate: 3, 
      discountUSD: parseNumber(row[8]),
      paidUSD: paidUSD,
      shippingType: row[15] || 'بحري',
      shippingCostIQD: shippingCost,
      exchangeRate: exchange,
      status: status
    });
  }

  const jsCode = `
const newPurchases = ${JSON.stringify(purchasesArray)};

try {
  // نستبدل القائمة بالكامل لكي لا تتكرر المضاعفات
  localStorage.setItem('gmb_purchases', JSON.stringify(newPurchases));
  
  console.log("تم تصفير التكرار وإضافة " + newPurchases.length + " فاتورة مشتريات.");
  alert("تم استيراد المشتريات بنجاح وإلغاء التكرار! سيتم تحديث الصفحة الآن.");
  window.location.reload();
} catch (e) {
  console.error("حدث خطأ:", e);
  alert("حدث خطأ أثناء الاستيراد.");
}
`;

  fs.writeFileSync('C:\\Users\\asus\\Desktop\\المشتريات_المصححة.txt', jsCode, 'utf-8');
  console.log("Done");
}

run();
