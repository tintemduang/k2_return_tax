import frappe
import json
import requests
from frappe.model.document import Document
from frappe.utils import now_datetime

class RTTRequestForm(Document):
    def before_save(self):
        if self.get("__islocal"):
            self.document_status = 1010

    def after_insert(self):
        self.append("action_history_table", {
            "username": frappe.session.user,
            "employee_code": self.employee_code,
            "employee_name": self.employee_name,
            "action": "Create Document",
            "action_date_time": now_datetime(),
            "remark": "Document created successfully."
        })
        self.save(ignore_permissions=True)

    @frappe.whitelist()
    def submit_workflow(self):
        settings = frappe.get_single("RTT Application Settings")
        api_endpoint = settings.endpoint_url
        api_key = settings.k2_api_key
        k2_method = settings.start_workflow
        workflow_name = settings.workflow_name
        current_doctype = self.doctype
        username = frappe.get_doc('User', frappe.session.user).username

        headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }

        data_fields = [
            {
                "name": "parm_document_number",
                "value": self.name
            },
            {
                "name": "parm_branch",
                "value": self.branch
            },
            {
                "name": "parm_plate_number",
                "value": self.plate_number
            }
        ]

        payload = json.dumps({
            'dataFields': data_fields,
            'imperSonateUsername': username,
            'workflowName': workflow_name
        })

        try:
            response = requests.post(api_endpoint + '/' + k2_method, headers=headers, data=payload)

            response.raise_for_status()
            process_instance_id = int(response.text)

            self.process_instance_id = process_instance_id
            self.save(ignore_permissions=True)
            frappe.db.commit()

            return response.text

        except Exception as e:
            frappe.throw(str(e))

    @frappe.whitelist()
    def get_task(self, serial_number):
        settings = frappe.get_single("RTT Application Settings")
        api_endpoint = settings.endpoint_url
        api_key = settings.k2_api_key
        k2_method = settings.get_task
        workflow_name = settings.workflow_name
        username = frappe.get_doc('User', frappe.session.user).username

        headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
        }

        payload = json.dumps({
            'imperSonateUsername': username,
                'SerialNumber': serial_number
        })

        try:
            response = requests.post(api_endpoint + '/' + k2_method, headers=headers, data=payload)
            return response.json()
        except Exception as e:
            frappe.throw(str(e))

    @frappe.whitelist()
    def action_workflow(self, action, serial_number):
        settings = frappe.get_single("RTT Application Settings")
        api_endpoint = settings.endpoint_url
        api_key = settings.k2_api_key
        k2_method = settings.action_workflow
        workflow_name = settings.workflow_name
        username = frappe.get_doc('User', frappe.session.user).username

        headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
        }

        payload = json.dumps({
            'imperSonateUsername': username,
            'workflowName': workflow_name,
            'CustomAction': action,
            'SerialNumber': serial_number
        })

        try:
            response = requests.post(api_endpoint + '/' + k2_method, headers=headers, data=payload)
            return response.text
        except Exception as e:
            frappe.throw(str(e))
            
    @frappe.whitelist()
    def create_action_history(self, action, remark=None, user=None):
        if not user:
            user = frappe.session.user

        self.append("action_history_table", {
            "username": user,
            "employee_code": self.employee_code,
            "employee_name": self.employee_name,
            "action": action,
            "action_date_time": now_datetime(),
            "remark": remark or ""
        })

        self.save(ignore_permissions=True)

    @frappe.whitelist()
    def update_document_status(self, status):
        self.document_status = status

        self.save(ignore_permissions=True)
        
