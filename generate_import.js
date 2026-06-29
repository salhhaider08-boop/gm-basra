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
  // 1. Process Purchases
  const purchasesContent = fs.readFileSync('C:\\Users\\asus\\Desktop\\GM ACCOUNTING - المشتريات (1).csv', 'utf-8');
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
      commissionRate: 3, // Default UI rate
      discountUSD: parseNumber(row[8]),
      paidUSD: paidUSD,
      shippingType: row[15] || 'بحري',
      shippingCostIQD: 0,
      exchangeRate: 1390, // From UI default
      status: 'قيد الشحن'
    });
  }

  // 2. Process Inside/Outside
  const inOutContent = fs.readFileSync('C:\\Users\\asus\\Desktop\\داخل خارج.csv', 'utf-8');
  const inOutRecords = parse(inOutContent, { skip_empty_lines: true });
  // Skip first 3 rows (0, 1, 2)
  const inOutDataRows = inOutRecords.slice(3);
  
  const transactionsArray = [];
  let tId = 1600000000000;

  for (let i = 0; i < inOutDataRows.length; i++) {
    const row = inOutDataRows[i];
    if (row.length < 6 || !row[0]) continue;
    
    const dateStr = row[0];
    if (!dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) continue;
    const formattedDate = dateStr.replace(/\//g, '-');

    const cashIn = parseNumber(row[2]);
    const cashOut = parseNumber(row[3]);
    const cardIn = parseNumber(row[4]);
    const cardOut = parseNumber(row[5]);

    if (cashIn > 0) {
      transactionsArray.push({ id: tId++, date: formattedDate, type: 'وارد نقد', amount: cashIn });
    }
    if (cashOut > 0) {
      transactionsArray.push({ id: tId++, date: formattedDate, type: 'خارج نقد', amount: cashOut });
    }
    if (cardIn > 0) {
      transactionsArray.push({ id: tId++, date: formattedDate, type: 'وارد ماستر', amount: cardIn });
    }
    if (cardOut > 0) {
      transactionsArray.push({ id: tId++, date: formattedDate, type: 'خارج ماستر', amount: cardOut });
    }
  }

  // Generate JS code
  const jsCode = `
// سكريبت استيراد البيانات لبرنامج GM Basra
// يرجى نسخ هذا الكود كاملاً ولصقه في شاشة الـ Console ثم الضغط على Enter

const newPurchases = ${JSON.stringify(purchasesArray)};
const newTransactions = ${JSON.stringify(transactionsArray)};

try {
  let existingPurchases = JSON.parse(localStorage.getItem('gmb_purchases') || '[]');
  let existingTransactions = JSON.parse(localStorage.getItem('gmb_transactions') || '[]');
  
  if (!Array.isArray(existingPurchases)) existingPurchases = [];
  if (!Array.isArray(existingTransactions)) existingTransactions = [];

  // دمج البيانات
  const finalPurchases = [...existingPurchases, ...newPurchases];
  const finalTransactions = [...existingTransactions, ...newTransactions];

  localStorage.setItem('gmb_purchases', JSON.stringify(finalPurchases));
  localStorage.setItem('gmb_transactions', JSON.stringify(finalTransactions));
  
  console.log("تمت إضافة " + newPurchases.length + " فاتورة مشتريات.");
  console.log("تمت إضافة " + newTransactions.length + " حركة مالية.");
  alert("تم استيراد البيانات بنجاح! سيتم تحديث الصفحة الآن.");
  window.location.reload();
} catch (e) {
  console.error("حدث خطأ أثناء الاستيراد:", e);
  alert("حدث خطأ أثناء الاستيراد، يرجى مراجعة الـ Console.");
}
`;

  fs.writeFileSync('C:\\Users\\asus\\Desktop\\كود_الاستيراد.txt', jsCode, 'utf-8');
  console.log("Done generating import script!");
}

run();
