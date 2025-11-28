export function convertToCSV(data: any): string {
  if (!Array.isArray(data)) {
    throw new Error('CSV conversion requires array data');
  }

  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(h => `"${h}"`).join(',');

  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}
