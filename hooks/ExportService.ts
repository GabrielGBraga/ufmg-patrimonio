import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/**
 * Data item type for export operations.
 * Can be any object with string keys and values of various types.
 */
type ExportDataItem = Record<string, string | number | boolean | null | undefined>;

/**
 * Exports data to an Excel (.xlsx) file and shares it with the user.
 * 
 * @param data - Array of objects to be exported to Excel
 * @param fileName - Name of the generated file (without extension). Defaults to "pesquisa"
 * @returns Promise that resolves when the file is successfully shared
 * @throws Error if file writing or sharing fails
 */
export const exportToExcel = async (
  data: ExportDataItem[],
  fileName: string = "pesquisa"
): Promise<void> => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = (FileSystem as any).cacheDirectory + `${fileName}.xlsx`;

    // Create the file and write base64 content
    await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
      encoding: "base64",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export to Excel failed:', error);
    throw new Error(`Failed to export to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Exports data to a PDF file and shares it with the user.
 * 
 * @param data - Array of objects to be exported to PDF. Keys from the first object are used as table headers
 * @param title - Title to display in the PDF document. Defaults to "Relatório de Pesquisa"
 * @returns Promise that resolves when the file is successfully shared
 * @throws Error if PDF generation or sharing fails
 * 
 * @example
 * ```typescript
 * const data = [
 *   { name: 'Item 1', value: 100 },
 *   { name: 'Item 2', value: 200 }
 * ];
 * await exportToPdf(data, 'My Report');
 * ```
 */
export const exportToPdf = async (
  data: ExportDataItem[],
  title: string = "Relatório de Pesquisa"
): Promise<void> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Cannot export empty data to PDF');
    }

    const keys = Object.keys(data[0] || {});

    const tableHeaders = keys.map(key => `<th>${key.toUpperCase()}</th>`).join('');
    const tableRows = data.map(item => `
      <tr>
        ${keys.map(key => `<td>${item[key] ?? ""}</td>`).join('')}
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #007AFF; color: white; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Export to PDF failed:', error);
    throw new Error(`Failed to export to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};