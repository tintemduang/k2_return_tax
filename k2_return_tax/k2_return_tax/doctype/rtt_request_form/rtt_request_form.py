import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class RTTRequestForm(Document):

    def after_insert(self):
        self.append("action_history_table", {
            "username": frappe.session.user,
            "employee_code": self.employee_code,
            "employee_name": self.employee_name,
            "action": "สร้างเอกสาร",
            "action_date_time": now_datetime(),
            "remark": None
        })

        self.save(ignore_permissions=True)