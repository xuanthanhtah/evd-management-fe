# EVD Management Portal

**Live Demo**: [https://evd-management-fe-rho.vercel.app/login](https://evd-management-fe-rho.vercel.app/login)

EVD Management Portal is a modern, enterprise-grade Single Page Application (SPA) built with React 19, TypeScript, and Vite. It provides a robust interface for managing EVD documents with full CRUD capabilities, role-based access control, and a high-performance bulk import feature.

## 🚀 Features

- **Authentication & Authorization**: Secure login system with role-based access control (Admin, Manager, Staff).
- **Document Management**: Create, Read, Update, and Delete (CRUD) documents.
- **Import**: High-performance bulk import supporting CSV and XLSX formats, capable of processing hundreds of thousands of rows via Web Workers.
- **Multilingual Support**: Fully localized in English and Vietnamese.
- **Responsive Design**: Modern UI built with Ant Design and Tailwind CSS.

## 📦 Tech Stack

- **Framework**: React 19, Vite
- **Language**: TypeScript
- **State Management**: Zustand, TanStack React Query
- **Styling**: Tailwind CSS, Ant Design
- **Validation**: Zod, React Hook Form
- **Backend / Database**: Supabase

## 📖 How to Use

### 1. Login
Access the [Live Demo](https://evd-management-fe-rho.vercel.app/login). You will need a valid account to log in. The application handles authentication securely via Supabase.

### 2. Managing Documents
Once logged in, you will be directed to the Document Management dashboard.
- **Search & Filter**: Use the search bar to find documents by code or title. Filter by status or category.
- **Create**: Click "Add Document" to create a new record.
- **Edit**: Double-click on any row in the table or use the "Edit" action button to modify a document.
- **Delete**: Use the trash icon to delete a document (requires Admin privileges).

### 3. Importing Files (Bulk Import)
The application supports bulk importing documents from a `.csv` or `.xlsx` file.

1. Click the **"Import File"** button.
2. Drag and drop your `.csv` or `.xlsx` file into the upload area.
3. The system will parse and validate the file in real-time. It will show a preview of valid and invalid rows.
4. Click **"Import X valid rows"** to insert the data into the database. The insertion happens in batches to ensure high performance and stability.

#### 📄 Sample Import File Structure

Your file must contain the exact following columns:

| code    | title              | category  | status |
|---------|--------------------|-----------|--------|
| DOC-001 | Contract Agreement | LEGAL     | ACTIVE |
| DOC-002 | Q4 Budget Report   | FINANCIAL | DRAFT  |
| DOC-003 | Onboarding Guide   | HR        | ACTIVE |

**Rules & Validation:**
- **code**: Required. Max 20 characters. Must be alphanumeric (can include `-` and `_`).
- **title**: Required. Max 255 characters.
- **category**: Must be exactly one of `LEGAL`, `FINANCIAL`, `TECHNICAL`, `HR`, `OTHER`.
- **status**: Must be exactly one of `ACTIVE`, `INACTIVE`, `DRAFT`.

*Note: The first row of your file must be the header row matching the column names above.*

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- Yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/xuanthanhtah/evd-management-fe.git
   cd evd-management-fe
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   yarn dev
   ```
