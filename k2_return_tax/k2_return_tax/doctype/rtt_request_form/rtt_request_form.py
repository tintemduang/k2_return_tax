import frappe
import json
import requests
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

    @frappe.whitelist()
    def submit_workflow(self):
        settings = frappe.get_single("RTT Application Settings")
        api_endpoint = settings.endpoint_url
        api_key = settings.k2_api_key
        workflow_name = None
        current_doctype = self.doctype
        username = frappe.get_doc('User', frappe.session.user).username

        for wf in settings.workflow:
            if wf.ref_doctype == current_doctype:
                workflow_name = wf.workflow_name.strip()
                workflow_name = workflow_name.replace('/', '\\').replace('\\\\', '\\')
                break

        if not workflow_name:
            frappe.throw(
                f"ไม่พบ Workflow สำหรับ Doctype: {current_doctype} ใน RTT Application Settings"
            )

        headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }

        data_fields = [
            {
                "name": "ParmDocID",
                "value": self.name
            }
        ]

        payload = json.dumps({
            'dataFields': data_fields,
            'imperSonateUsername': username,
            'workflowName': workflow_name
        })

        try:
            response = requests.post(api_endpoint + '/' +'startworkflow', headers=headers, data=payload)
            return response.text
        except Exception as e:
            frappe.throw(str(e))