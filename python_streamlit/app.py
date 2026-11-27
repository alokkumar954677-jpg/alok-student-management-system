"""
Student Management System - Streamlit Web Application
Converted from Python CLI + Pandas into a persistent SQLite-backed Admin Dashboard.
"""

from io import BytesIO
from pathlib import Path
import streamlit as st
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

import database as db


# ---------------------------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Student Management System",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)


def load_custom_css() -> None:
    """Load custom Deep Emerald & White CSS styling."""
    css_path = Path(__file__).resolve().parent / "styles.css"
    if css_path.exists():
        st.markdown(f"<style>{css_path.read_text(encoding='utf-8')}</style>", unsafe_allow_html=True)


def render_page_header(title: str, subtitle: str) -> None:
    """Render a consistent header block across all pages."""
    st.markdown(
        f"""
        <div class="page-header">
            <h1 class="page-title">{title}</h1>
            <p class="page-subtitle">{subtitle}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def build_excel_bytes(df: pd.DataFrame) -> bytes:
    """Generate an .xlsx Excel workbook with colored column headers and plain white data rows."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Student Records")
        ws = writer.sheets["Student Records"]

        header_fill = PatternFill(start_color="062C24", end_color="062C24", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=11)
        white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
        data_font = Font(color="0F172A", size=11)

        inner_side = Side(style="thin", color="64748B")
        outer_side = Side(style="medium", color="062C24")
        header_div = Side(style="thin", color="1D5E4F")

        max_row = ws.max_row
        max_col = ws.max_column

        ws.row_dimensions[1].height = 26
        for col_idx, cell in enumerate(ws[1], start=1):
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(
                horizontal="right" if col_idx in (1, 3) else "left",
                vertical="center",
            )
            cell.border = Border(
                top=outer_side,
                bottom=outer_side,
                left=outer_side if col_idx == 1 else header_div,
                right=outer_side if col_idx == max_col else header_div,
            )

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, max_row=max_row, max_col=max_col), start=2):
            ws.row_dimensions[row_idx].height = 21
            is_last = row_idx == max_row
            for col_idx, cell in enumerate(row, start=1):
                cell.fill = white_fill
                cell.font = data_font
                cell.border = Border(
                    top=inner_side,
                    bottom=outer_side if is_last else inner_side,
                    left=outer_side if col_idx == 1 else inner_side,
                    right=outer_side if col_idx == max_col else inner_side,
                )
                cell.alignment = Alignment(
                    horizontal="right" if col_idx in (1, 3) else "left",
                    vertical="center",
                )

        column_widths = {"A": 16, "B": 28, "C": 12, "D": 22}
        for col_letter, width in column_widths.items():
            ws.column_dimensions[col_letter].width = width

        ws.auto_filter.ref = f"A1:D{ws.max_row}"
        ws.freeze_panes = "A2"

    return output.getvalue()


# ---------------------------------------------------------------------------
# Page Views
# ---------------------------------------------------------------------------
def view_dashboard() -> None:
    """Render the Admin Dashboard with KPIs and recent student records."""
    render_page_header(
        "Dashboard",
        "Overview of enrolled students, age distribution, and recent records.",
    )

    metrics = db.get_dashboard_metrics()
    total = metrics["total_students"]
    avg_age = f"{metrics['average_age']} yrs" if metrics["average_age"] is not None else "—"
    youngest = metrics["youngest_student"]
    youngest_val = f"{youngest['age']} yrs" if youngest else "—"
    youngest_sub = (
        f"{youngest['name']} · Roll #{youngest['roll_no']}"
        if youngest
        else "No students recorded yet"
    )

    col1, col2, col3 = st.columns(3, gap="medium")
    with col1:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Total Students</div>
                <div class="kpi-value">{total}</div>
                <div class="kpi-meta">Persisted in SQLite</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Average Student Age</div>
                <div class="kpi-value">{avg_age}</div>
                <div class="kpi-meta">Calculated with Pandas</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Youngest Student</div>
                <div class="kpi-value">{youngest_val}</div>
                <div class="kpi-meta">{youngest_sub}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)

    header_left, header_right = st.columns([3, 1])
    with header_left:
        st.subheader("Recent Student Records")
    with header_right:
        full_df = db.get_all_students_df()
        if not full_df.empty:
            excel_bytes = build_excel_bytes(full_df)
            st.download_button(
                label="Export Excel",
                data=excel_bytes,
                file_name="students_records.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
            )

    recent_df: pd.DataFrame = metrics["recent_df"]
    if recent_df.empty:
        st.info("No student records found. Navigate to 'Add Student' in the sidebar to create your first record.")
    else:
        st.dataframe(recent_df, use_container_width=True, hide_index=True)


def view_add_student() -> None:
    """Render the Add Student form with duplicate Roll Number validation."""
    render_page_header(
        "Add Student",
        "Register a new student record into the persistent SQLite database.",
    )

    with st.form("add_student_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            roll_no = st.number_input(
                "Student Roll Number",
                min_value=1,
                step=1,
                value=101,
                help="Unique integer identifier for the student.",
            )
        with col2:
            age = st.number_input(
                "Student Age",
                min_value=1,
                max_value=120,
                step=1,
                value=18,
            )

        name = st.text_input(
            "Student Name",
            placeholder="e.g., Aarav Sharma",
            max_chars=120,
        )

        submitted = st.form_submit_button("Save Student", type="primary")
        if submitted:
            success, message = db.add_student(int(roll_no), name, int(age))
            if success:
                st.success(message)
            else:
                st.error(message)


def view_all_students() -> None:
    """Render the full student directory table with Excel export."""
    render_page_header(
        "View Students",
        "Complete roster of all registered students managed via Pandas DataFrame.",
    )

    df = db.get_all_students_df()

    top_left, top_right = st.columns([3, 1])
    with top_left:
        st.caption(f"Showing {len(df)} total student record(s)")
    with top_right:
        if not df.empty:
            excel_data = build_excel_bytes(df)
            st.download_button(
                label="Export to Excel",
                data=excel_data,
                file_name="students_records.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
            )

    if df.empty:
        st.info("The student directory is currently empty. Add a student to see records here.")
    else:
        st.dataframe(
            df[["Roll Number", "Student Name", "Age", "Created At"]],
            use_container_width=True,
            hide_index=True,
        )


def view_search_student() -> None:
    """Render Search Student interface supporting both Roll Number and Name."""
    render_page_header(
        "Search Student",
        "Look up student records instantly by Roll Number or Student Name.",
    )

    col1, col2 = st.columns([2, 1])
    with col1:
        query = st.text_input(
            "Search Query",
            placeholder="Enter Roll Number (e.g. 101) or Student Name...",
        )
    with col2:
        search_mode = st.selectbox(
            "Search By",
            options=["Both", "Roll Number", "Student Name"],
        )

    if query.strip():
        results_df = db.search_students_df(query, search_by=search_mode)
        if results_df.empty:
            st.warning("No matching student records found.")
        else:
            st.success(f"Found {len(results_df)} matching record(s).")
            st.dataframe(results_df, use_container_width=True, hide_index=True)
    else:
        st.info("Enter a Roll Number or Name above to search the database.")


def view_update_student() -> None:
    """Render Update Student workflow allowing edits to Roll Number, Name, and Age."""
    render_page_header(
        "Update Student",
        "Select an existing student to modify their Roll Number, Name, or Age.",
    )

    students = db.get_all_students_list()
    if not students:
        st.info("No students available to update. Please add a student first.")
        return

    options = {f"Roll #{s['roll_no']} — {s['name']} (Age {s['age']})": s for s in students}
    selected_label = st.selectbox("Select Student to Edit", options=list(options.keys()))
    selected = options[selected_label]

    with st.form("update_student_form"):
        col1, col2 = st.columns(2)
        with col1:
            new_roll = st.number_input(
                "Roll Number",
                min_value=1,
                step=1,
                value=int(selected["roll_no"]),
            )
        with col2:
            new_age = st.number_input(
                "Age",
                min_value=1,
                max_value=120,
                step=1,
                value=int(selected["age"]),
            )

        new_name = st.text_input(
            "Student Name",
            value=str(selected["name"]),
            max_chars=120,
        )

        save_btn = st.form_submit_button("Save Updated Information", type="primary")
        if save_btn:
            success, message = db.update_student(
                original_roll_no=int(selected["roll_no"]),
                new_roll_no=int(new_roll),
                new_name=new_name,
                new_age=int(new_age),
            )
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)


def view_delete_student() -> None:
    """Render Delete Student workflow with explicit confirmation step."""
    render_page_header(
        "Delete Student",
        "Remove a student record permanently after confirmation.",
    )

    students = db.get_all_students_list()
    if not students:
        st.info("No student records available to delete.")
        return

    options = {f"Roll #{s['roll_no']} — {s['name']} (Age {s['age']})": s for s in students}
    selected_label = st.selectbox("Select Student to Delete", options=list(options.keys()))
    selected = options[selected_label]

    st.warning(
        f"You are about to permanently delete **{selected['name']}** "
        f"(Roll Number: **{selected['roll_no']}**, Age: **{selected['age']}**)."
    )

    confirm = st.checkbox("I confirm I want to permanently delete this student record.")
    if st.button("Delete Selected Student", type="primary", disabled=not confirm):
        success, message = db.delete_student(int(selected["roll_no"]))
        if success:
            st.success(message)
            st.rerun()
        else:
            st.error(message)


# ---------------------------------------------------------------------------
# Main Application Entrypoint
# ---------------------------------------------------------------------------
def main() -> None:
    db.init_db()
    load_custom_css()

    with st.sidebar:
        st.markdown(
            """
            <div class="sidebar-brand">
                <div class="sidebar-brand-title">Student Manager</div>
                <div class="sidebar-brand-sub">Academic Records Portal</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        page = st.radio(
            "Navigation",
            options=[
                "Dashboard",
                "Add Student",
                "View Students",
                "Search Student",
                "Update Student",
                "Delete Student",
            ],
            label_visibility="collapsed",
        )

        st.markdown("---")
        st.caption("SQLite Database · Persistent Storage")

    if page == "Dashboard":
        view_dashboard()
    elif page == "Add Student":
        view_add_student()
    elif page == "View Students":
        view_all_students()
    elif page == "Search Student":
        view_search_student()
    elif page == "Update Student":
        view_update_student()
    elif page == "Delete Student":
        view_delete_student()


if __name__ == "__main__":
    main()
