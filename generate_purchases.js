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
      shippingCostIQD: 0,
      exchangeRate: 1390,
      status: 'قيد الشحن'
    });
  }

  const jsCode = `
const newPurchases = ${JSON.stringify(purchasesArray)};

try {
  let existingPurchases = JSON.parse(localStorage.getItem('gmb_purchases') || '[]');
  if (!Array.isArray(existingPurchases)) existingPurchases = [];

  const finalPurchases = [...existingPurchases, ...newPurchases];
  localStorage.setItem('gmb_purchases', JSON.stringify(finalPurchases));
  
  console.log("تمت إضافة " + newPurchases.length + " فاتورة مشتريات.");
  alert("تم استيراد المشتريات بنجاح! سيتم تحديث الصفحة الآن.");
  window.location.reload();
} catch (e) {
  console.error("حدث خطأ:", e);
  alert("حدث خطأ أثناء الاستيراد.");
}
`;

  fs.writeFileSync('C:\\Users\\asus\\Desktop\\المشتريات.txt', jsCode, 'utf-8');
  console.log("Done");
}

run();
