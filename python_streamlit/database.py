"""
Database module for the Student Management System.
Handles SQLite connection, automatic schema initialization, and parameterized CRUD operations.
"""

import sqlite3
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
import pandas as pd

# Store database inside a dedicated data directory so records persist across restarts
DB_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DB_DIR / "students.db"


def get_connection() -> sqlite3.Connection:
    """Create and return a SQLite database connection with row factory enabled."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the students table automatically if it does not already exist."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                roll_no INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL CHECK(age > 0 AND age <= 120),
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
            """
        )
        conn.commit()


def add_student(roll_no: int, name: str, age: int) -> Tuple[bool, str]:
    """
    Insert a new student record.
    Validates duplicate roll numbers and basic field constraints.
    """
    clean_name = name.strip()
    if roll_no <= 0:
        return False, "Roll number must be a positive integer."
    if not clean_name:
        return False, "Student name cannot be empty."
    if age <= 0 or age > 120:
        return False, "Student age must be between 1 and 120."

    try:
        with get_connection() as conn:
            existing = conn.execute(
                "SELECT roll_no FROM students WHERE roll_no = ?",
                (roll_no,),
            ).fetchone()
            if existing is not None:
                return False, f"Roll number {roll_no} already exists. Please use a unique roll number."

            conn.execute(
                "INSERT INTO students (roll_no, name, age) VALUES (?, ?, ?)",
                (roll_no, clean_name, age),
            )
            conn.commit()
        return True, f"Student '{clean_name}' (Roll No: {roll_no}) added successfully."
    except sqlite3.Error as exc:
        return False, f"Database error while adding student: {exc}"


def get_all_students_df() -> pd.DataFrame:
    """Fetch all student records as a Pandas DataFrame ordered by most recently created."""
    try:
        with get_connection() as conn:
            df = pd.read_sql_query(
                """
                SELECT
                    roll_no AS "Roll Number",
                    name AS "Student Name",
                    age AS "Age",
                    created_at AS "Created At"
                FROM students
                ORDER BY created_at DESC, roll_no ASC
                """,
                conn,
            )
        return df
    except sqlite3.Error:
        return pd.DataFrame(columns=["Roll Number", "Student Name", "Age", "Created At"])


def get_all_students_list() -> List[Dict[str, Any]]:
    """Fetch all student records as a list of dictionaries for selectors."""
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT roll_no, name, age, created_at FROM students ORDER BY roll_no ASC"
            ).fetchall()
        return [dict(row) for row in rows]
    except sqlite3.Error:
        return []


def search_students_df(query: str, search_by: str = "Both") -> pd.DataFrame:
    """
    Search student records by Roll Number and/or Student Name using parameterized queries.
    """
    clean_query = query.strip()
    if not clean_query:
        return get_all_students_df()

    try:
        with get_connection() as conn:
            if search_by == "Roll Number":
                if not clean_query.isdigit():
                    return pd.DataFrame(columns=["Roll Number", "Student Name", "Age", "Created At"])
                sql = """
                    SELECT roll_no AS "Roll Number", name AS "Student Name", age AS "Age", created_at AS "Created At"
                    FROM students
                    WHERE roll_no = ?
                    ORDER BY roll_no ASC
                """
                params: Tuple[Any, ...] = (int(clean_query),)
            elif search_by == "Student Name":
                sql = """
                    SELECT roll_no AS "Roll Number", name AS "Student Name", age AS "Age", created_at AS "Created At"
                    FROM students
                    WHERE LOWER(name) LIKE LOWER(?)
                    ORDER BY roll_no ASC
                """
                params = (f"%{clean_query}%",)
            else:
                if clean_query.isdigit():
                    sql = """
                        SELECT roll_no AS "Roll Number", name AS "Student Name", age AS "Age", created_at AS "Created At"
                        FROM students
                        WHERE roll_no = ? OR LOWER(name) LIKE LOWER(?)
                        ORDER BY roll_no ASC
                    """
                    params = (int(clean_query), f"%{clean_query}%")
                else:
                    sql = """
                        SELECT roll_no AS "Roll Number", name AS "Student Name", age AS "Age", created_at AS "Created At"
                        FROM students
                        WHERE LOWER(name) LIKE LOWER(?)
                        ORDER BY roll_no ASC
                    """
                    params = (f"%{clean_query}%",)

            return pd.read_sql_query(sql, conn, params=params)
    except sqlite3.Error:
        return pd.DataFrame(columns=["Roll Number", "Student Name", "Age", "Created At"])


def update_student(original_roll_no: int, new_roll_no: int, new_name: str, new_age: int) -> Tuple[bool, str]:
    """
    Update an existing student's Roll Number, Name, and Age.
    Prevents colliding with another student's Roll Number.
    """
    clean_name = new_name.strip()
    if new_roll_no <= 0:
        return False, "Roll number must be a positive integer."
    if not clean_name:
        return False, "Student name cannot be empty."
    if new_age <= 0 or new_age > 120:
        return False, "Student age must be between 1 and 120."

    try:
        with get_connection() as conn:
            target = conn.execute(
                "SELECT roll_no FROM students WHERE roll_no = ?",
                (original_roll_no,),
            ).fetchone()
            if target is None:
                return False, f"Student with Roll Number {original_roll_no} was not found."

            if new_roll_no != original_roll_no:
                conflict = conn.execute(
                    "SELECT roll_no FROM students WHERE roll_no = ?",
                    (new_roll_no,),
                ).fetchone()
                if conflict is not None:
                    return False, f"Cannot reassign to Roll Number {new_roll_no}; it belongs to another student."

            conn.execute(
                """
                UPDATE students
                SET roll_no = ?, name = ?, age = ?
                WHERE roll_no = ?
                """,
                (new_roll_no, clean_name, new_age, original_roll_no),
            )
            conn.commit()
        return True, f"Student record updated successfully (Roll No: {new_roll_no})."
    except sqlite3.Error as exc:
        return False, f"Database error while updating student: {exc}"


def delete_student(roll_no: int) -> Tuple[bool, str]:
    """Delete a student record by Roll Number."""
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM students WHERE roll_no = ?",
                (roll_no,),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return False, f"Invalid student roll number: {roll_no}."
        return True, f"Student with Roll Number {roll_no} deleted successfully."
    except sqlite3.Error as exc:
        return False, f"Database error while deleting student: {exc}"


def get_dashboard_metrics() -> Dict[str, Any]:
    """Compute summary metrics for the Admin Dashboard using Pandas."""
    df = get_all_students_df()
    if df.empty:
        return {
            "total_students": 0,
            "average_age": None,
            "youngest_student": None,
            "recent_df": df,
        }

    total_students = int(len(df))
    average_age = round(float(df["Age"].mean()), 1)
    youngest_row = df.loc[df["Age"].idxmin()]
    youngest_student: Optional[Dict[str, Any]] = {
        "name": str(youngest_row["Student Name"]),
        "age": int(youngest_row["Age"]),
        "roll_no": int(youngest_row["Roll Number"]),
    }

    return {
        "total_students": total_students,
        "average_age": average_age,
        "youngest_student": youngest_student,
        "recent_df": df.head(5),
    }
