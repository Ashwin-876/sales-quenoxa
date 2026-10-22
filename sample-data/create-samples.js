import * as xlsx from '../server/node_modules/xlsx/xlsx.mjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prospects = [
  {
    'Customer Name': 'Ramesh Sundaram',
    'Company Name': 'Apex Logistics & Freight India',
    'Email': 'ramesh.s@apexlogistics.in',
    'Phone': '+919840123456',
    'Industry': 'Logistics & Supply Chain',
    'Location': 'Chennai, Tamil Nadu',
    'Fleet Size': '65 Trucks',
    'Current System': 'Manual Excel Spreadsheets',
    'Identified Problem': 'Consignment delays and manual telephone order status inquiries'
  },
  {
    'Customer Name': 'Dr. Kavitha Mohan',
    'Company Name': 'CareFirst Multi-Speciality Clinics',
    'Email': 'kavitha.m@carefirstclinics.org',
    'Phone': '+919884567890',
    'Industry': 'Healthcare Services',
    'Location': 'Coimbatore, Tamil Nadu',
    'Fleet Size': 'N/A',
    'Current System': 'Paper registers and WhatsApp',
    'Identified Problem': 'Patient scheduling mix-ups and delayed diagnostic report sharing'
  },
  {
    'Customer Name': 'Venkatesh Babu',
    'Company Name': 'Sri Krishna Textiles & Garments',
    'Email': 'v.babu@srikrishnatex.com',
    'Phone': '+919443123890',
    'Industry': 'Textiles & Apparel Manufacturing',
    'Location': 'Tirupur, Tamil Nadu',
    'Fleet Size': 'N/A',
    'Current System': 'Legacy static website from 2018',
    'Identified Problem': 'Lack of international buyer discovery and zero web inquiries'
  },
  {
    'Customer Name': 'Arjun Swaminathan',
    'Company Name': 'Zenith FinServe Capital',
    'Email': 'arjun@zenithfinserve.co.in',
    'Phone': '+919820543210',
    'Industry': 'Financial Services & Wealth Management',
    'Location': 'Bangalore, Karnataka',
    'Fleet Size': 'N/A',
    'Current System': 'Desktop CRM and spreadsheets',
    'Identified Problem': 'Manual KYC extraction taking 4 days per loan applicant'
  },
  {
    'Customer Name': 'Meenakshi Sundaram',
    'Company Name': 'Kaveri Agro Tech & Food Processing',
    'Email': 'meenakshi@kaveriagro.com',
    'Phone': '+919789012345',
    'Industry': 'Agriculture & Food Processing',
    'Location': 'Madurai, Tamil Nadu',
    'Fleet Size': '18 delivery vans',
    'Current System': 'Tally and manual daily WhatsApp reports',
    'Identified Problem': 'No centralized revenue and stock inventory visibility across 32 stores'
  },
  {
    // Test Edge Case: Duplicate Record
    'Customer Name': 'Ramesh Sundaram (Duplicate)',
    'Company Name': 'Apex Logistics & Freight India',
    'Email': 'ramesh.s@apexlogistics.in',
    'Phone': '+919840123456',
    'Industry': 'Logistics & Supply Chain',
    'Location': 'Chennai, Tamil Nadu',
    'Fleet Size': '65 Trucks',
    'Current System': 'Manual Excel Spreadsheets',
    'Identified Problem': 'Duplicate entry testing'
  },
  {
    // Test Edge Case: Invalid Email and Missing Phone
    'Customer Name': 'Subramaniam Chettiar',
    'Company Name': 'Chettinad Heritage Exports',
    'Email': 'invalid-email-format-without-at',
    'Phone': '',
    'Industry': 'Export & Handicrafts',
    'Location': 'Karaikudi, Tamil Nadu',
    'Fleet Size': 'N/A',
    'Current System': 'None',
    'Identified Problem': 'Missing contact coordinates and invalid email format'
  }
];

// Write Excel
const worksheet = xlsx.utils.json_to_sheet(prospects);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Prospect Directory');

const excelPath = path.join(__dirname, 'Quenoxa_Prospects_TamilNadu.xlsx');
const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(excelPath, buffer);
console.log('Created sample Excel spreadsheet at:', excelPath);

// Write CSV
const csvPath = path.join(__dirname, 'TamilNadu_Manufacturing_Tech_Leads.csv');
const csvContent = xlsx.utils.sheet_to_csv(worksheet);
fs.writeFileSync(csvPath, csvContent, 'utf-8');
console.log('Created sample CSV at:', csvPath);
