# Student Management System (Streamlit + SQLite + Pandas)

A modern, persistent **Student Management Admin Dashboard** converted from a console-based Python + Pandas script into a full-featured web application using **Streamlit**, **SQLite**, **Pandas**, **OpenPyXL**, and custom **Deep Emerald & White CSS**.

## Project Folder Structure

```text
student-management-system/
├── app.py              # Main Streamlit UI and navigation router
├── database.py         # SQLite connection, schema creation, and parameterized CRUD functions
├── styles.css          # Deep Emerald & White Admin Dashboard theme
├── requirements.txt    # Python package dependencies
├── README.md           # Documentation, setup, GitHub & deployment guide
└── data/
    └── students.db     # Auto-generated persistent SQLite database
```

## Features

- **Admin Dashboard**: Displays Total Students, Average Student Age, Youngest Student, and Recent Student Records.
- **Add Student**: Validates unique Roll Numbers (`roll_no` Primary Key), Name, and Age (1–120).
- **View Students**: Clean Pandas-powered table showing Roll Number, Name, Age, and Created Timestamp.
- **Search Student**: Instant parameterized search by Roll Number, Student Name, or both.
- **Update Student**: Edit an existing student's Roll Number, Name, and Age with duplicate conflict checks.
- **Delete Student**: Confirmation checkbox before permanently removing a record.
- **Excel Table Export**: One-click export of all student records to a styled `.xlsx` Excel table (`students_records.xlsx`).
- **Persistent SQLite Storage**: Automatically creates `data/students.db` and retains all data across restarts.

---

## Run Locally in VS Code

1. Open the `python_streamlit` folder in **VS Code**:
   ```bash
   code python_streamlit
   ```
2. Open the VS Code integrated terminal (`Ctrl + ~` or `Terminal -> New Terminal`) and create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the Streamlit web application:
   ```bash
   streamlit run app.py
   ```
   The app opens automatically at `http://localhost:8501`.

---

## Upload to GitHub

1. Create a `.gitignore` file in your project root:
   ```text
   venv/
   __pycache__/
   data/*.db
   ```
2. Initialize Git and push to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Student Management System with Streamlit and SQLite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/student-management-system.git
   git push -u origin main
   ```

---

## Deploy Online (Streamlit Community Cloud - Free)

1. Push your `python_streamlit` folder contents to a public or private GitHub repository.
2. Go to [share.streamlit.io](https://share.streamlit.io/) and sign in with GitHub.
3. Click **New app**.
4. Select your repository, branch (`main`), and set **Main file path** to `app.py`.
5. Click **Deploy** — your Student Management System will be live on a shareable public URL within ~1 minute.
